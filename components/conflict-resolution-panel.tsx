"use client"

import type { Operation } from "@/lib/conflict-resolver"

interface ConflictResolutionPanelProps {
  conflicts: Array<{ op1: Operation; op2: Operation; resolution: string; timestamp: number }>
  visible: boolean
  onClose: () => void
}

export default function ConflictResolutionPanel({ conflicts, visible, onClose }: ConflictResolutionPanelProps) {
  if (!visible || conflicts.length === 0) {
    return null
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-card border-2 border-accent rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Conflict Log</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          ✕
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {conflicts
          .slice(-5)
          .reverse()
          .map((conflict, idx) => (
            <div key={idx} className="text-xs bg-muted/50 p-2 rounded border border-border">
              <div className="font-mono text-accent mb-1">{formatTime(conflict.timestamp)}</div>
              <div className="text-muted-foreground mb-1">
                <span>{conflict.op1.type}</span> vs <span>{conflict.op2.type}</span>
              </div>
              <div className="text-primary text-xs font-semibold">Resolution: {conflict.resolution}</div>
            </div>
          ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Total conflicts: {conflicts.length}</p>
      </div>
    </div>
  )
}
