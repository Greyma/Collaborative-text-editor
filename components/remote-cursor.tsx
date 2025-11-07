"use client"

import { useEffect, useState } from "react"

interface RemoteCursorProps {
  userId: string
  userName: string
  color: string
  position: number
  content: string
}

export default function RemoteCursor({ userId, userName, color, position, content }: RemoteCursorProps) {
  const [cursorStyle, setCursorStyle] = useState<{ top: string; left: string; display: string }>({
    top: "0",
    left: "0",
    display: "none",
  })

  useEffect(() => {
    // Calculate line and column from position in content
    const textBeforeCursor = content.substring(0, Math.min(position, content.length))
    const lines = textBeforeCursor.split("\n")
    const lineNumber = lines.length - 1
    const column = lines[lines.length - 1].length

    // Approximate pixel position (rough calculation)
    const lineHeight = 20 // mono font line height
    const charWidth = 8 // mono font char width
    const topOffset = 64 // editor top padding

    setCursorStyle({
      top: `${topOffset + lineNumber * lineHeight}px`,
      left: `${28 + column * charWidth}px`,
      display: position <= content.length ? "block" : "none",
    })
  }, [position, content])

  return (
    <div
      className="absolute w-0.5 h-5 pointer-events-none animate-pulse"
      style={{
        ...cursorStyle,
        backgroundColor: color,
        opacity: 0.9,
        zIndex: 10,
      }}
      title={`${userName}'s cursor`}
    >
      <div
        className="absolute top-full left-0 mt-1 px-2 py-1 rounded bg-foreground text-background text-xs font-semibold whitespace-nowrap"
        style={{
          backgroundColor: color,
          color: "white",
          transform: "translateY(2px)",
        }}
      >
        {userName}
      </div>
    </div>
  )
}
