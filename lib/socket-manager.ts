let socket: WebSocket | null = null
const messageQueue: any[] = []
let isConnected = false

export type Operation = {
  id: string
  type: "insert" | "delete"
  position: number
  content?: string
  length?: number
  timestamp: number
  userId: string
  revision?: number
}

const operationState = {
  pendingOperations: new Map<string, Operation>(),
  lastAcknowledgedRevision: 0,
}

export function initializeSocket(userId: string, userName: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      ? new URL(process.env.NEXT_PUBLIC_SOCKET_URL).host
      : window.location.host

    const wsUrl = `${protocol}//${baseUrl}/api/ws`

    try {
      socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log("[v0] WebSocket connected")
        isConnected = true

        // Send user info
        socket?.send(
          JSON.stringify({
            type: "join",
            userId,
            userName,
          }),
        )

        // Flush message queue
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift()
          socket?.send(JSON.stringify(msg))
        }

        resolve(socket!)
      }

      socket.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
        reject(error)
      }

      socket.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        isConnected = false
      }
    } catch (error) {
      reject(error)
    }
  })
}

export function sendOperation(operation: Operation) {
  if (!socket || !isConnected) {
    messageQueue.push({ type: "operation", data: operation })
    console.log("[v0] Operation queued, will send when connected")
    return
  }

  operationState.pendingOperations.set(operation.id, operation)

  socket.send(
    JSON.stringify({
      type: "operation",
      data: operation,
    }),
  )

  console.log("[v0] Operation sent:", operation.id)
}

export function sendCursorPosition(userId: string, position: number) {
  if (!socket || !isConnected) return

  socket.send(
    JSON.stringify({
      type: "cursor",
      userId,
      position,
    }),
  )
}

export function getPendingOperations(): Operation[] {
  return Array.from(operationState.pendingOperations.values())
}

export function acknowledgeOperation(operationId: string) {
  operationState.pendingOperations.delete(operationId)
  console.log("[v0] Operation acknowledged:", operationId)
}

export function onMessage(callback: (data: any) => void) {
  if (!socket) return
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === "operationAck") {
        acknowledgeOperation(data.operationId)
      }

      callback(data)
    } catch (error) {
      console.error("[v0] Failed to parse message:", error)
    }
  }
}

export function closeSocket() {
  if (socket) {
    socket.close()
    socket = null
    isConnected = false
    operationState.pendingOperations.clear()
  }
}

export function isSocketConnected(): boolean {
  return isConnected && socket !== null
}
