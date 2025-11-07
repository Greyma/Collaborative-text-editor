"use client"

interface Activity {
  id: string
  timestamp: number
  userId: string
  userName: string
  action: "joined" | "left" | "edited" | "typed"
  content?: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getActionLabel = (action: string, userName: string) => {
    switch (action) {
      case "joined":
        return `${userName} joined the document`
      case "left":
        return `${userName} left the document`
      case "edited":
        return `${userName} made edits`
      case "typed":
        return `${userName} is typing...`
      default:
        return `${userName} performed an action`
    }
  }

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No recent activity</p>
      ) : (
        activities
          .slice(-10)
          .reverse()
          .map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground flex-shrink-0">{formatTime(activity.timestamp)}</span>
              <span className="text-foreground flex-1">{getActionLabel(activity.action, activity.userName)}</span>
            </div>
          ))
      )}
    </div>
  )
}
