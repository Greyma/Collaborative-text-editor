"use client"

interface PresenceIndicatorProps {
  users: Array<{ id: string; name: string; color: string }>
  currentUserId: string
  typingUsers: string[]
}

export default function PresenceIndicator({ users, currentUserId, typingUsers }: PresenceIndicatorProps) {
  const remoteUsers = users.filter((u) => u.id !== currentUserId)

  if (remoteUsers.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        You are working alone
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">
        {remoteUsers.length} collaborator{remoteUsers.length !== 1 ? "s" : ""} online
      </div>

      <div className="flex gap-2 flex-wrap">
        {remoteUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-border"
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: user.color }} />
            <span className="text-xs text-foreground">{user.name}</span>
            {typingUsers.includes(user.id) && <span className="text-xs text-accent ml-1">typing...</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
