"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  message: string
  timestamp: number
}

interface ChatPanelProps {
  messages: ChatMessage[]
  currentUserId: string
  onSendMessage: (message: string) => void
  isCollapsed?: boolean
}

export default function ChatPanel({ messages, currentUserId, onSendMessage, isCollapsed }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput("")
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (isCollapsed) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Chat</h3>
        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-8">No messages yet. Start chatting!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-xs" style={{ color: msg.userColor }}>
                    {msg.userName}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  {msg.userId === currentUserId && <span className="text-xs text-accent">(You)</span>}
                </div>
                <div className="bg-muted/50 p-2 rounded text-foreground break-words">{msg.message}</div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type message..."
          className="text-sm"
        />
        <Button size="sm" onClick={handleSend} className="bg-primary hover:bg-primary/90 flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
