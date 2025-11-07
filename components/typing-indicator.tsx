interface User {
  id: string
  name: string
  color: string
}

interface TypingIndicatorProps {
  typingUsers: string[]
  users: User[]
}

export default function TypingIndicator({ typingUsers, users }: TypingIndicatorProps) {
  const typingUserNames = typingUsers
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean)
    .join(", ")

  if (typingUsers.length === 0) return null

  return (
    <div className="p-4 border-t border-border text-sm text-muted-foreground">
      <p>
        {typingUserNames} {typingUsers.length === 1 ? "is" : "are"} typing...
      </p>
      <div className="flex gap-1 mt-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  )
}
