"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { sendCursorPosition } from "@/lib/socket-manager"
import RemoteCursor from "./remote-cursor"

interface EditorContentProps {
  text: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  currentUserId?: string
  userCursors?: Record<string, { position: number; color: string; name: string }>
}

export default function EditorContent({ text, onChange, currentUserId = "", userCursors = {} }: EditorContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorSyncTimeoutRef = useRef<NodeJS.Timeout>()
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleCursorMove = () => {
      const position = textarea.selectionStart

      if (currentUserId) {
        setIsTyping(true)

        if (cursorSyncTimeoutRef.current) {
          clearTimeout(cursorSyncTimeoutRef.current)
        }

        cursorSyncTimeoutRef.current = setTimeout(() => {
          sendCursorPosition(currentUserId, position)
          console.log(`[v0] Cursor position updated: ${position}`)
          setIsTyping(false)
        }, 100)
      }
    }

    textarea.addEventListener("click", handleCursorMove)
    textarea.addEventListener("keyup", handleCursorMove)

    return () => {
      textarea.removeEventListener("click", handleCursorMove)
      textarea.removeEventListener("keyup", handleCursorMove)
      if (cursorSyncTimeoutRef.current) {
        clearTimeout(cursorSyncTimeoutRef.current)
      }
    }
  }, [currentUserId])

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Shared Document</h2>
        <p className="text-sm text-muted-foreground">
          All edits sync in real-time • {Object.keys(userCursors).filter((id) => id !== currentUserId).length}{" "}
          collaborator cursor(s) visible
        </p>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={onChange}
          placeholder="Start typing... Your changes will be synchronized across all connected clients."
          className="flex-1 p-4 font-mono text-sm resize-none border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 w-full h-full"
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Object.entries(userCursors).map(([userId, cursorData]) =>
            userId !== currentUserId ? (
              <RemoteCursor
                key={userId}
                userId={userId}
                userName={cursorData.name}
                color={cursorData.color}
                position={cursorData.position}
                content={text}
              />
            ) : null,
          )}
        </div>
      </div>
    </div>
  )
}
