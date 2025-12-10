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

// Room and document management
const documents: Map<string, any> = new Map()
const userSessions: Map<string, any> = new Map()
const conflictLogs: Map<string, ConflictLog> = new Map()
const roomMetadata: Map<string, { createdAt: Date; lastActivity: Date; userCount: number }> = new Map()

// REST API endpoint to get active rooms
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(documents.entries()).map(([roomId, doc]) => ({
    roomId,
    userCount: doc.users.length,
    createdAt: roomMetadata.get(roomId)?.createdAt || new Date(),
    lastActivity: roomMetadata.get(roomId)?.lastActivity || new Date(),
  }))
  res.json({ rooms })
})

// REST API endpoint to get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params
  const doc = documents.get(roomId)
  
  if (!doc) {
    return res.status(404).json({ error: 'Room not found' })
  }
  
  res.json({
    roomId,
    userCount: doc.users.length,
    users: doc.users,
    metadata: roomMetadata.get(roomId),
  })
})

io.on("connection", (socket: Socket) => {
  console.log("[Socket] User connected:", socket.id)

  socket.on("join", (data) => {
    const { documentId, userId, userName, userColor } = data
    console.log(`[Socket] ${userName} joining room ${documentId}`)

    userSessions.set(socket.id, { documentId, userId, userName, userColor })
    socket.join(documentId)

    // Initialize room if it doesn't exist
    if (!documents.has(documentId)) {
      documents.set(documentId, {
        content: "",
        users: [],
        operations: [],
        activities: [],
      })
      roomMetadata.set(documentId, {
        createdAt: new Date(),
        lastActivity: new Date(),
        userCount: 0,
      })
      console.log(`[Socket] Created new room: ${documentId}`)
    }

    const doc = documents.get(documentId)
    const metadata = roomMetadata.get(documentId)
    
    // Add user if not already in the room
    if (!doc.users.find((u: any) => u.id === userId)) {
      doc.users.push({ id: userId, name: userName, color: userColor })
    }
    
    // Update room metadata
    if (metadata) {
      metadata.lastActivity = new Date()
      metadata.userCount = doc.users.length
    }

    // Send current document state to the joining user
    socket.emit("document-sync", { 
      content: doc.content,
      roomId: documentId,
    })
    
    // Notify all users in the room about updated user list
    io.to(documentId).emit("users-updated", { users: doc.users })

    // Broadcast activity
    io.to(documentId).emit("activity-update", {
      userId,
      userName,
      action: "joined",
    })

    console.log(`[Socket] Room ${documentId} now has ${doc.users.length} users`)
  })

  socket.on("edit", (data) => {
    const session = userSessions.get(socket.id)
    if (!session) return

    const { documentId } = session
    const doc = documents.get(documentId)
    if (!doc) return

    const incomingOp = data.operation

    // Update room activity
    const metadata = roomMetadata.get(documentId)
    if (metadata) {
      metadata.lastActivity = new Date()
    }

    // Check for conflicts with recent operations
    if (doc.operations.length > 0) {
      const recentOps = doc.operations.slice(-5)
      for (const recentOp of recentOps) {
        if (detectConflict(recentOp, incomingOp)) {
          console.log(`[Socket] Conflict detected in room ${documentId}`)
          if (!conflictLogs.has(documentId)) {
            conflictLogs.set(documentId, new ConflictLog())
          }
          conflictLogs.get(documentId)?.logConflict(recentOp, incomingOp, "resolved by timestamp")
        }
      }
    }

    doc.content = applyOperation(doc.content, incomingOp)
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
        
        // Update room metadata
        const metadata = roomMetadata.get(session.documentId)
        if (metadata) {
          metadata.userCount = doc.users.length
          metadata.lastActivity = new Date()
        }
        
        io.to(session.documentId).emit("users-updated", { users: doc.users })

        io.to(session.documentId).emit("activity-update", {
          userId: session.userId,
          userName: session.userName,
          action: "left",
        })
        console.log(`[Socket] ${session.userName} left room ${session.documentId} (${doc.users.length} users remaining)`)
        
        // Clean up empty rooms after 5 minutes of inactivity
        if (doc.users.length === 0) {
          setTimeout(() => {
            const currentDoc = documents.get(session.documentId)
            if (currentDoc && currentDoc.users.length === 0) {
              documents.delete(session.documentId)
              roomMetadata.delete(session.documentId)
              conflictLogs.delete(session.documentId)
              console.log(`[Socket] Cleaned up empty room: ${session.documentId}`)
            }
          }, 5 * 60 * 1000) // 5 minutes
        }
      }
    }
    userSessions.delete(socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`)
})
