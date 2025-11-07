"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, RotateCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HistoryEntry {
  id: string
  timestamp: number
  userId: string
  userName: string
  action: string
  content?: string
}

interface HistoryPanelProps {
  history: HistoryEntry[]
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export default function HistoryPanel({ history, onUndo, onRedo, canUndo, canRedo }: HistoryPanelProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground mb-3">History</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onUndo} disabled={!canUndo} className="flex-1 bg-transparent">
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button size="sm" variant="outline" onClick={onRedo} disabled={!canRedo} className="flex-1 bg-transparent">
            Redo
            <RotateCw className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No history yet</p>
          ) : (
            history
              .slice()
              .reverse()
              .slice(0, 20)
              .map((entry, idx) => (
                <div key={entry.id} className="text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      #{history.length - idx}
                    </Badge>
                    <span className="font-medium text-foreground">{entry.action}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{entry.userName}</span>
                    <span>{formatTime(entry.timestamp)}</span>
                  </div>
                  {entry.content && (
                    <div className="mt-1 text-muted-foreground font-mono truncate">
                      "{entry.content.substring(0, 30)}..."
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
