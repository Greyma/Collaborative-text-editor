// This creates a WebSocket endpoint at /api/ws for client connections

import { globalSyncManager } from "@/lib/sync-manager"
import { upgrade } from "bun" // Declare the Bun variable

// In-memory storage for WebSocket connections
const clientConnections = new Map<string, WebSocket>()
const clientMetadata = new Map<string, { userName: string; color: string }>()

// Broadcast a message to all connected clients except the sender
function broadcastToAllClients(message: any, excludeUserId?: string) {
  const messageStr = JSON.stringify(message)
  clientConnections.forEach((socket, userId) => {
    if (excludeUserId && userId === excludeUserId) return
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(messageStr)
    }
  })
}

// Send a message to a specific client
function sendToClient(userId: string, message: any) {
  const socket = clientConnections.get(userId)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

export async function GET(req: Request) {
  // Upgrade HTTP connection to WebSocket
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected Upgrade header", { status: 400 })
  }

  try {
    // Create WebSocket connection
    const { socket, response } = upgrade(req, {
      data: null,
    })

    socket.onopen = () => {
      console.log("[v0] WebSocket client connected")
    }

    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data.toString())
        console.log("[v0] Received message:", data.type)

        if (data.type === "join") {
          // Client joining the session
          const { userId, userName } = data
          const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]
          const color = colors[Math.floor(Math.random() * colors.length)]

          clientConnections.set(userId, socket)
          clientMetadata.set(userId, { userName, color })
          globalSyncManager.addClient(userId, userName, color)

          console.log(`[v0] User ${userName} joined`)

          // Send current document state to the new client
          const state = globalSyncManager.getDocumentState()
          sendToClient(userId, {
            type: "documentState",
            content: state.content,
            users: state.users,
            operations: globalSyncManager.getFullHistory().slice(-100), // Last 100 operations
          })

          // Notify all other clients of the new user
          broadcastToAllClients(
            {
              type: "userJoined",
              userId,
              userName,
              color,
            },
            userId,
          )
        } else if (data.type === "operation") {
          // Client sending an edit operation
          const { data: operation } = data
          const metadata = clientMetadata.get(operation.userId)

          if (metadata) {
            // Apply operation and get result
            const result = globalSyncManager.applyOperation(operation)

            if (result.success) {
              // Acknowledge to sender
              sendToClient(operation.userId, {
                type: "operationAck",
                operationId: operation.id,
              })

              // Broadcast to all other clients
              broadcastToAllClients(
                {
                  type: "operation",
                  operation: operation,
                },
                operation.userId,
              )

              console.log(`[v0] Operation applied and broadcasted: ${operation.id}`)
            } else {
              console.warn("[v0] Operation failed:", result.error)
              sendToClient(operation.userId, {
                type: "operationError",
                operationId: operation.id,
                error: result.error,
              })
            }
          }
        } else if (data.type === "cursor") {
          // Client updating cursor position
          const { userId, position } = data
          globalSyncManager.updateClientCursor(userId, position)

          // Broadcast cursor to all other clients
          const metadata = clientMetadata.get(userId)
          if (metadata) {
            broadcastToAllClients(
              {
                type: "cursor",
                userId,
                userName: metadata.userName,
                position,
              },
              userId,
            )
          }
        } else if (data.type === "typing") {
          // Client typing indicator
          const { userId } = data
          const metadata = clientMetadata.get(userId)

          if (metadata) {
            broadcastToAllClients(
              {
                type: "typing",
                userId,
                userName: metadata.userName,
              },
              userId,
            )
          }
        }
      } catch (error) {
        console.error("[v0] Error processing message:", error)
      }
    }

    socket.onclose = () => {
      console.log("[v0] WebSocket client disconnected")

      // Find which user disconnected
      let disconnectedUserId: string | null = null
      for (const [userId, sock] of clientConnections.entries()) {
        if (sock === socket) {
          disconnectedUserId = userId
          break
        }
      }

      if (disconnectedUserId) {
        const metadata = clientMetadata.get(disconnectedUserId)
        globalSyncManager.removeClient(disconnectedUserId)
        clientConnections.delete(disconnectedUserId)
        clientMetadata.delete(disconnectedUserId)

        console.log(`[v0] User disconnected: ${metadata?.userName || disconnectedUserId}`)

        // Notify remaining clients
        broadcastToAllClients({
          type: "userLeft",
          userId: disconnectedUserId,
        })
      }
    }

    socket.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
    }

    return response
  } catch (error) {
    console.error("[v0] Failed to upgrade connection:", error)
    return new Response("Failed to upgrade connection", { status: 500 })
  }
}
