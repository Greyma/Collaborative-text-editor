// Backend Socket.IO server (run separately with: node server.ts)
// Install dependencies: npm install express socket.io cors

import express from "express"
import { createServer } from "http"
import { Server, type Socket } from "socket.io"
import cors from "cors"
import { detectConflict, ConflictLog } from "./lib/conflict-resolver"
import { applyOperation } from "./lib/operational-transform";

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ["*"],
    methods: ["GET", "POST"],
  },
})

app.use(cors())

// Storage structure: rooms -> documents -> document data
const rooms: Map<string, Map<string, any>> = new Map()
const userSessions: Map<string, any> = new Map()
const conflictLogs: Map<string, ConflictLog> = new Map()

// Helper function to generate room-document key
function getRoomDocumentKey(roomId: string, documentId: string): string {
  return `${roomId}:${documentId}`
}

// Helper function to get or create a room
function getOrCreateRoom(roomId: string): Map<string, any> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map())
  }
  return rooms.get(roomId)!
}

// Helper function to get or create a document in a room
function getOrCreateDocument(roomId: string, documentId: string): any {
  const room = getOrCreateRoom(roomId)
  if (!room.has(documentId)) {
    room.set(documentId, {
      content: "",
      users: [],
      operations: [],
      activities: [],
    })
  }
  return room.get(documentId)
}

io.on("connection", (socket: Socket) => {
  console.log("[Socket] User connected:", socket.id)

  // Get list of available rooms
  socket.on("list-rooms", () => {
    const roomsList = Array.from(rooms.keys()).map(roomId => ({
      id: roomId,
      userCount: Array.from(userSessions.values()).filter(s => s.roomId === roomId).length,
    }))
    socket.emit("rooms-list", { rooms: roomsList })
  })

  socket.on("join", (data) => {
    const { documentId, userId, userName, userColor, roomId = "default-room" } = data
    console.log(`[Socket] ${userName} joining room ${roomId}, document ${documentId}`)

    userSessions.set(socket.id, { documentId, userId, userName, userColor, roomId })
    const roomDocumentId = getRoomDocumentKey(roomId, documentId)
    socket.join(roomDocumentId)

    const doc = getOrCreateDocument(roomId, documentId)
    if (!doc.users.find((u: any) => u.id === userId)) {
      doc.users.push({ id: userId, name: userName, color: userColor })
    }

    socket.emit("document-sync", { content: doc.content })
    io.to(roomDocumentId).emit("users-updated", { users: doc.users })

    // Broadcast activity
    io.to(roomDocumentId).emit("activity-update", {
      userId,
      userName,
      action: "joined",
    })

    console.log(`[Socket] Room ${roomId}, Document ${documentId} now has ${doc.users.length} users`)
  })

  socket.on("edit", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    const { documentId, roomId } = session
    const doc = getOrCreateDocument(roomId, documentId)
    if (!doc) return

    const incomingOp = data.operation
    const conflictKey = `${roomId}:${documentId}`

    // Check for conflicts with recent operations
    if (doc.operations.length > 0) {
      const recentOps = doc.operations.slice(-5)
      for (const recentOp of recentOps) {
        if (detectConflict(recentOp, incomingOp)) {
          console.log(`[Socket] Conflict detected between operations`)
          if (!conflictLogs.has(conflictKey)) {
            conflictLogs.set(conflictKey, new ConflictLog())
          }
          conflictLogs.get(conflictKey)?.logConflict(recentOp, incomingOp, "resolved by timestamp")
        }
      }
    }

    doc.content = applyOperation(doc.content, incomingOp)
    doc.operations.push(incomingOp)

    const roomDocumentId = getRoomDocumentKey(roomId, documentId)
    socket.to(roomDocumentId).emit("edit-received", {
      userId: session.userId,
      userName: session.userName,
      operation: incomingOp,
    })

    io.to(roomDocumentId).emit("activity-update", {
      userId: session.userId,
      userName: session.userName,
      action: "edited",
    })
  })

  socket.on("cursor", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    const roomDocumentId = getRoomDocumentKey(session.roomId, session.documentId)
    socket.to(roomDocumentId).emit("cursor-update", {
      userId: session.userId,
      userName: session.userName,
      userColor: session.userColor,
      position: data.position,
    })
  })

  socket.on("typing", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    const roomDocumentId = getRoomDocumentKey(session.roomId, session.documentId)
    socket.to(roomDocumentId).emit("typing-update", {
      userId: session.userId,
      userName: session.userName,
      isTyping: data.isTyping,
    })
  })

  socket.on("chat", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    console.log(`[Socket] Chat from ${session.userName} in room ${session.roomId}`)

    const roomDocumentId = getRoomDocumentKey(session.roomId, session.documentId)
    socket.to(roomDocumentId).emit("chat-received", {
      userId: session.userId,
      userName: session.userName,
      userColor: session.userColor,
      message: data.message,
      timestamp: data.timestamp,
    })

    // Broadcast to everyone including sender
    io.to(roomDocumentId).emit("activity-update", {
      userId: session.userId,
      userName: session.userName,
      action: "message",
    })
  })

  socket.on("disconnect", () => {
    const session = userSessions.get(socket.id)
    if (session) {
      const doc = getOrCreateDocument(session.roomId, session.documentId)
      if (doc) {
        doc.users = doc.users.filter((u: any) => u.id !== session.userId)
        const roomDocumentId = getRoomDocumentKey(session.roomId, session.documentId)
        io.to(roomDocumentId).emit("users-updated", { users: doc.users })

        io.to(roomDocumentId).emit("activity-update", {
          userId: session.userId,
          userName: session.userName,
          action: "left",
        })
        console.log(`[Socket] ${session.userName} left room ${session.roomId}, document ${session.documentId}`)
      }
    }
    userSessions.delete(socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`)
})
