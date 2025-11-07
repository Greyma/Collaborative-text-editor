"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import EditorContent from "@/components/editor-content"
import UsersList from "@/components/users-list"
import TypingIndicator from "@/components/typing-indicator"
import { initializeSocket, sendOperation, onMessage, closeSocket, type Operation } from "@/lib/socket-manager"
import { applyOperation, transformOperation, isValidOperation } from "@/lib/operational-transform"

interface User {
  id: string
  name: string
  color: string
}

interface CursorData {
  position: number
  color: string
  name: string
}

interface PendingOperation {
  op: Operation
  acknowledged: boolean
}

export default function EditorPage() {
  const [documentText, setDocumentText] = useState("")
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [currentUserName, setCurrentUserName] = useState("")
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [userCursors, setUserCursors] = useState<Record<string, CursorData>>({})
  const [isConnected, setIsConnected] = useState(false)

  const operationHistoryRef = useRef<Operation[]>([])
  const pendingOperationsRef = useRef<PendingOperation[]>([])
  const lastCursorPositionRef = useRef(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const userColorsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    // Initialize user
    const userId = Math.random().toString(36).substr(2, 9)
    const userNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"]
    const userName = userNames[Math.floor(Math.random() * userNames.length)] + " " + userId.slice(0, 3)

    setCurrentUserId(userId)
    setCurrentUserName(userName)

    // Initialize WebSocket connection
    const setupSocket = async () => {
      try {
        await initializeSocket(userId, userName)
        setIsConnected(true)
        console.log("[v0] Socket initialized successfully")

        // Setup message handler
        onMessage((data) => {
          console.log("[v0] Received message:", data)

          if (data.type === "userJoined") {
            const newUser: User = {
              id: data.userId,
              name: data.userName,
              color: data.color,
            }
            userColorsRef.current[data.userId] = data.color
            setConnectedUsers((prev) => {
              const exists = prev.some((u) => u.id === data.userId)
              return exists ? prev : [...prev, newUser]
            })
          } else if (data.type === "userLeft") {
            setConnectedUsers((prev) => prev.filter((u) => u.id !== data.userId))
            setUserCursors((prev) => {
              const updated = { ...prev }
              delete updated[data.userId]
              return updated
            })
            delete userColorsRef.current[data.userId]
          } else if (data.type === "operation") {
            handleRemoteOperation(data.operation)
          } else if (data.type === "cursor") {
            const cursorData: CursorData = {
              position: data.position,
              color: userColorsRef.current[data.userId] || "#3B82F6",
              name: data.userName || "User",
            }
            setUserCursors((prev) => ({
              ...prev,
              [data.userId]: cursorData,
            }))
            console.log(`[v0] Updated cursor for ${data.userName}: position ${data.position}`)
          } else if (data.type === "documentState") {
            setDocumentText(data.content)
            setConnectedUsers(data.users || [])
            operationHistoryRef.current = data.operations || []
            data.users?.forEach((user: User) => {
              userColorsRef.current[user.id] = user.color
            })
          } else if (data.type === "operationAck") {
            // Mark operation as acknowledged
            const pendingIdx = pendingOperationsRef.current.findIndex((p) => p.op.id === data.operationId)
            if (pendingIdx !== -1) {
              pendingOperationsRef.current[pendingIdx].acknowledged = true
              console.log("[v0] Operation acknowledged:", data.operationId)
            }
          } else if (data.type === "typing") {
            if (data.userId !== userId) {
              setTypingUsers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]))
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((id) => id !== data.userId))
              }, 1500)
            }
          }
        })
      } catch (error) {
        console.error("[v0] Failed to initialize socket:", error)
      }
    }

    setupSocket()

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]
    const color = colors[Math.floor(Math.random() * colors.length)]
    userColorsRef.current[userId] = color

    setConnectedUsers([{ id: userId, name: userName, color }])

    return () => {
      closeSocket()
    }
  }, [])

  const handleRemoteOperation = useCallback((remoteOp: Operation) => {
    console.log("[v0] Applying remote operation:", remoteOp)

    setDocumentText((prev) => {
      let newText = prev
      let transformedOp = remoteOp

      // Transform against all pending operations
      for (const pending of pendingOperationsRef.current) {
        transformedOp = transformOperation(transformedOp, pending.op)
      }

      // Validate before applying
      if (!isValidOperation(transformedOp, prev)) {
        console.warn("[v0] Invalid operation received, skipping", transformedOp)
        return prev
      }

      // Apply the transformed operation
      newText = applyOperation(newText, transformedOp)
      operationHistoryRef.current.push(transformedOp)

      console.log("[v0] Remote operation applied successfully, new length:", newText.length)

      return newText
    })
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const oldText = documentText
    const cursorPos = e.currentTarget.selectionStart

    // Detect operation type
    if (newText.length > oldText.length) {
      // Insert operation
      const diff = newText.length - oldText.length
      const insertedText = newText.substring(Math.max(0, cursorPos - diff), cursorPos)
      const operation: Operation = {
        id: `${currentUserId}-${Date.now()}-${Math.random()}`,
        type: "insert",
        position: cursorPos - insertedText.length,
        content: insertedText,
        timestamp: Date.now(),
        userId: currentUserId,
        revision: operationHistoryRef.current.length,
      }

      console.log("[v0] Creating insert operation:", operation)

      const pending: PendingOperation = { op: operation, acknowledged: false }
      pendingOperationsRef.current.push(pending)

      sendOperation(operation)
    } else if (newText.length < oldText.length) {
      // Delete operation
      const deletedLength = oldText.length - newText.length
      const operation: Operation = {
        id: `${currentUserId}-${Date.now()}-${Math.random()}`,
        type: "delete",
        position: cursorPos,
        length: deletedLength,
        timestamp: Date.now(),
        userId: currentUserId,
        revision: operationHistoryRef.current.length,
      }

      console.log("[v0] Creating delete operation:", operation)

      const pending: PendingOperation = { op: operation, acknowledged: false }
      pendingOperationsRef.current.push(pending)

      sendOperation(operation)
    }

    setDocumentText(newText)
    lastCursorPositionRef.current = cursorPos

    // Send typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      // Typing complete
    }, 1000)

    // Simulate typing indicator broadcast (in production, would send via socket)
    setTypingUsers((prev) => [...new Set([...prev, currentUserId])])
    setTimeout(() => {
      setTypingUsers((prev) => prev.filter((id) => id !== currentUserId))
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collaborative Document</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isConnected ? (
                <>
                  <span className="text-green-600 font-semibold">● Connected</span> • {connectedUsers.length} user(s)
                  editing • {Object.keys(userCursors).length} remote cursor(s) visible
                </>
              ) : (
                <span className="text-yellow-600 font-semibold">● Connecting...</span>
              )}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{documentText.length} characters</p>
            <p>{documentText.split("\n").length} lines</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <EditorContent
          text={documentText}
          onChange={handleTextChange}
          currentUserId={currentUserId}
          userCursors={userCursors}
        />

        {/* Sidebar */}
        <div className="w-64 border-l border-border bg-card flex flex-col overflow-hidden">
          <UsersList users={connectedUsers} currentUserId={currentUserId} userCursors={userCursors} />
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers.filter((id) => id !== currentUserId)} users={connectedUsers} />
          )}
        </div>
      </div>
    </div>
  )
}
