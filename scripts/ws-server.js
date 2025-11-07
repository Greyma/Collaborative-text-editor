const WebSocket = require("ws")
const http = require("http")

// Document state management
const documentState = {
  content: "",
  operations: [],
  clients: new Map(),
}

const userColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]
let colorIndex = 0

// Create WebSocket server
const server = http.createServer()
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {
  const clientId = `client-${Date.now()}-${Math.random()}`
  const color = userColors[colorIndex % userColors.length]
  colorIndex++

  console.log(`[v0] New client connected: ${clientId}`)

  const clientInfo = {
    id: clientId,
    name: "User",
    color,
    socket: ws,
  }

  // Send initial document state
  ws.send(
    JSON.stringify({
      type: "documentState",
      content: documentState.content,
      operations: documentState.operations,
      users: Array.from(documentState.clients.values()).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      })),
    }),
  )

  // Broadcast user joined to others
  broadcastToOthers(clientId, {
    type: "userJoined",
    userId: clientId,
    userName: clientInfo.name,
    color,
  })

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data)

      if (message.type === "join") {
        clientInfo.name = message.userName
        documentState.clients.set(clientId, clientInfo)
        console.log(`[v0] User ${clientInfo.name} joined`)

        // Broadcast user list update
        broadcastToAll({
          type: "userJoined",
          userId: clientId,
          userName: clientInfo.name,
          color,
        })
      } else if (message.type === "operation") {
        const operation = message.data
        documentState.operations.push(operation)

        // Apply operation to document
        if (operation.type === "insert" && operation.content) {
          documentState.content =
            documentState.content.slice(0, operation.position) +
            operation.content +
            documentState.content.slice(operation.position)
        } else if (operation.type === "delete" && operation.length) {
          documentState.content =
            documentState.content.slice(0, operation.position) +
            documentState.content.slice(operation.position + operation.length)
        }

        console.log("[v0] Operation applied:", operation.type, "at", operation.position)

        // Broadcast operation to other clients
        broadcastToOthers(clientId, {
          type: "operation",
          operation,
        })

        // Send acknowledgement to sender
        ws.send(
          JSON.stringify({
            type: "operationAck",
            operationId: operation.id,
          }),
        )
      } else if (message.type === "cursor") {
        broadcastToOthers(clientId, {
          type: "cursor",
          userId: clientId,
          position: message.position,
        })
      } else if (message.type === "typing") {
        broadcastToOthers(clientId, {
          type: "typing",
          userId: clientId,
        })
      }
    } catch (error) {
      console.error("[v0] Error handling message:", error)
    }
  })

  ws.on("close", () => {
    documentState.clients.delete(clientId)
    console.log(`[v0] Client ${clientId} disconnected`)

    broadcastToAll({
      type: "userLeft",
      userId: clientId,
    })
  })

  ws.on("error", (error) => {
    console.error("[v0] WebSocket error:", error)
  })
})

// Broadcast to all connected clients
function broadcastToAll(message) {
  const msgStr = JSON.stringify(message)
  documentState.clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(msgStr)
    }
  })
}

// Broadcast to all except sender
function broadcastToOthers(excludeId, message) {
  const msgStr = JSON.stringify(message)
  documentState.clients.forEach((client, id) => {
    if (id !== excludeId && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(msgStr)
    }
  })
}

// Start server
const PORT = process.env.WS_PORT || 8080
server.listen(PORT, () => {
  console.log(`[v0] WebSocket server running on ws://localhost:${PORT}`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[v0] Shutting down WebSocket server...")
  wss.clients.forEach((ws) => ws.close())
  server.close(() => {
    console.log("[v0] Server closed")
    process.exit(0)
  })
})
