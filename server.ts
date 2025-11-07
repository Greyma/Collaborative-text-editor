// Backend Socket.IO server (run separately with: node server.ts)
// Install dependencies: npm install express socket.io cors

import express from "express"
import { createServer } from "http"
import { Server, type Socket } from "socket.io"
import cors from "cors"
import { detectConflict, ConflictLog } from "./lib/conflict-resolver"

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
})

app.use(cors())

const documents: Map<string, any> = new Map()
const userSessions: Map<string, any> = new Map()
const conflictLogs: Map<string, ConflictLog> = new Map()

io.on("connection", (socket: Socket) => {
  console.log("[Socket] User connected:", socket.id)

  socket.on("join", (data) => {
    const { documentId, userId, userName, userColor } = data
    console.log(`[Socket] ${userName} joining document ${documentId}`)

    userSessions.set(socket.id, { documentId, userId, userName, userColor })
    socket.join(documentId)

    if (!documents.has(documentId)) {
      documents.set(documentId, {
        content: "",
        users: [],
        operations: [],
        activities: [],
      })
    }

    const doc = documents.get(documentId)
    if (!doc.users.find((u: any) => u.id === userId)) {
      doc.users.push({ id: userId, name: userName, color: userColor })
    }

    socket.emit("document-sync", { content: doc.content })
    io.to(documentId).emit("users-updated", { users: doc.users })

    // Broadcast activity
    io.to(documentId).emit("activity-update", {
      userId,
      userName,
      action: "joined",
    })

    console.log(`[Socket] Document ${documentId} now has ${doc.users.length} users`)
  })

  socket.on("edit", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    const { documentId } = session
    const doc = documents.get(documentId)
    if (!doc) return

    const incomingOp = data.operation

    // Check for conflicts with recent operations
    if (doc.operations.length > 0) {
      const recentOps = doc.operations.slice(-5)
      for (const recentOp of recentOps) {
        if (detectConflict(recentOp, incomingOp)) {
          console.log(`[Socket] Conflict detected between operations`)
          if (!conflictLogs.has(documentId)) {
            conflictLogs.set(documentId, new ConflictLog())
          }
          conflictLogs.get(documentId)?.logConflict(recentOp, incomingOp, "resolved by timestamp")
        }
      }
    }

    doc.content = data.content
    doc.operations.push(incomingOp)

    socket.to(documentId).emit("edit-received", {
      userId: session.userId,
      userName: session.userName,
      operation: incomingOp,
    })

    io.to(documentId).emit("activity-update", {
      userId: session.userId,
      userName: session.userName,
      action: "edited",
    })
  })

  socket.on("cursor", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    socket.to(session.documentId).emit("cursor-update", {
      userId: session.userId,
      userName: session.userName,
      userColor: session.userColor,
      position: data.position,
    })
  })

  socket.on("typing", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    socket.to(session.documentId).emit("typing-update", {
      userId: session.userId,
      userName: session.userName,
      isTyping: data.isTyping,
    })
  })

  socket.on("chat", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    console.log(`[Socket] Chat from ${session.userName} in ${session.documentId}`)

    socket.to(session.documentId).emit("chat-received", {
      userId: session.userId,
      userName: session.userName,
      userColor: session.userColor,
      message: data.message,
      timestamp: data.timestamp,
    })

    // Broadcast to everyone including sender
    io.to(session.documentId).emit("activity-update", {
      userId: session.userId,
      userName: session.userName,
      action: "message",
    })
  })

  socket.on("disconnect", () => {
    const session = userSessions.get(socket.id)
    if (session) {
      const doc = documents.get(session.documentId)
      if (doc) {
        doc.users = doc.users.filter((u: any) => u.id !== session.userId)
        io.to(session.documentId).emit("users-updated", { users: doc.users })

        io.to(session.documentId).emit("activity-update", {
          userId: session.userId,
          userName: session.userName,
          action: "left",
        })
        console.log(`[Socket] ${session.userName} left document ${session.documentId}`)
      }
    }
    userSessions.delete(socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`)
})
