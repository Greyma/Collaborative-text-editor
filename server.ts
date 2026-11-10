import express from "express"
import { createServer } from "http"
import { Server, type Socket } from "socket.io"
import cors from "cors"
import { detectConflict, ConflictLog } from "./lib/conflict-resolver"
import { applyOperation } from "./lib/operational-transform";
import { closeRoomStore, loadRoom, saveRoom } from "./lib/room-store"
import { getUserId } from "./lib/user-id"

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

const MAX_NAME_LENGTH = 64
const MAX_DOCUMENT_LENGTH = 1_000_000
const SAVE_DELAY_MS = 1000
const saveTimers: Map<string, NodeJS.Timeout> = new Map()

function isValidName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_NAME_LENGTH
}

function persistRoom(roomId: string) {
  const doc = documents.get(roomId)
  if (!doc) return
  try {
    saveRoom(roomId, doc.content, roomMetadata.get(roomId)?.createdAt ?? new Date())
  } catch (error) {
    console.error(`[DB] Failed to save room ${roomId}:`, error)
  }
}

function scheduleSave(roomId: string) {
  if (saveTimers.has(roomId)) return
  saveTimers.set(
    roomId,
    setTimeout(() => {
      saveTimers.delete(roomId)
      persistRoom(roomId)
    }, SAVE_DELAY_MS),
  )
}

// Writes a pending save right away; does nothing if the room has no unsaved edit.
function flushRoom(roomId: string) {
  const timer = saveTimers.get(roomId)
  if (!timer) return
  clearTimeout(timer)
  saveTimers.delete(roomId)
  persistRoom(roomId)
}

// Removes one connection; the user only leaves the room with their last connection.
function detachSocket(socket: Socket, session: any) {
  const { documentId, userId, userName } = session
  userSessions.delete(socket.id)
  socket.leave(documentId)

  const doc = documents.get(documentId)
  if (!doc) return

  const connections: Set<string> | undefined = doc.connections.get(userId)
  connections?.delete(socket.id)
  if (connections && connections.size > 0) return

  doc.connections.delete(userId)
  doc.users = doc.users.filter((u: any) => u.id !== userId)

  const metadata = roomMetadata.get(documentId)
  if (metadata) {
    metadata.userCount = doc.users.length
    metadata.lastActivity = new Date()
  }

  io.to(documentId).emit("users-updated", { users: doc.users })
  io.to(documentId).emit("activity-update", { userId, userName, action: "left" })
  console.log(`[Socket] ${userName} left room ${documentId} (${doc.users.length} users remaining)`)

  if (doc.users.length === 0) {
    flushRoom(documentId)

    // Free the memory of empty rooms after 5 minutes; their content stays in the database.
    setTimeout(() => {
      const currentDoc = documents.get(documentId)
      if (currentDoc && currentDoc.users.length === 0) {
        documents.delete(documentId)
        roomMetadata.delete(documentId)
        conflictLogs.delete(documentId)
        console.log(`[Socket] Cleaned up empty room: ${documentId}`)
      }
    }, 5 * 60 * 1000)
  }
}

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
    const { documentId, userName, userColor } = data ?? {}
    if (!isValidName(documentId) || !isValidName(userName)) return

    const userId = getUserId(userName)
    console.log(`[Socket] ${userName} joining room ${documentId}`)

    // A connection belongs to one user in one room at a time.
    const previousSession = userSessions.get(socket.id)
    if (previousSession) detachSocket(socket, previousSession)

    socket.join(documentId)

    // Initialize room if it isn't in memory, restoring its saved content if any
    if (!documents.has(documentId)) {
      const saved = loadRoom(documentId)
      documents.set(documentId, {
        content: saved?.content ?? "",
        users: [],
        connections: new Map<string, Set<string>>(),
        operations: [],
        activities: [],
      })
      roomMetadata.set(documentId, {
        createdAt: saved?.createdAt ?? new Date(),
        lastActivity: new Date(),
        userCount: 0,
      })
      console.log(`[Socket] ${saved ? "Restored" : "Created new"} room: ${documentId}`)
    }

    const doc = documents.get(documentId)
    const metadata = roomMetadata.get(documentId)

    // Singleton per user name: a new connection is attached to the existing user, if any.
    const isNewUser = !doc.connections.has(userId)
    if (isNewUser) {
      doc.connections.set(userId, new Set<string>())
      doc.users.push({ id: userId, name: userName.trim(), color: userColor })
    }
    doc.connections.get(userId).add(socket.id)

    const user = doc.users.find((u: any) => u.id === userId)
    userSessions.set(socket.id, { documentId, userId, userName: user.name, userColor: user.color })


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
    if (isNewUser) {
      io.to(documentId).emit("activity-update", {
        userId,
        userName: user.name,
        action: "joined",
      })
    }

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

    const newContent = applyOperation(doc.content, incomingOp)
    if (newContent.length > MAX_DOCUMENT_LENGTH) {
      // Refuse the edit and put the sender back on the server's version.
      socket.emit("document-sync", { content: doc.content, roomId: documentId })
      return
    }

    doc.content = newContent
    doc.operations.push(incomingOp)
    scheduleSave(documentId)

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
    if (session) detachSocket(socket, session)
  })
})

// Don't lose the last edits when the container stops.
function shutdown() {
  for (const roomId of Array.from(saveTimers.keys())) flushRoom(roomId)
  closeRoomStore()
  process.exit(0)
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`)
})
