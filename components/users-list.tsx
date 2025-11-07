import { Badge } from "@/components/ui/badge"
import { Circle } from "lucide-react"
import ActivityFeed from "./activity-feed"
import PresenceIndicator from "./presence-indicator"

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

interface Activity {
  id: string
  timestamp: number
  userId: string
  userName: string
  action: "joined" | "left" | "edited" | "typed"
  content?: string
}

interface UsersListProps {
  users: User[]
  currentUserId: string
  userCursors?: Record<string, CursorData>
  activities?: Activity[]
  typingUsers?: string[]
}

export default function UsersList({
  users = [],
  currentUserId,
  userCursors = {},
  activities = [],
  typingUsers = [],
}: UsersListProps) {
  return (
    <div className="p-4 border-b border-border overflow-y-auto flex-1 flex flex-col gap-4">
      <PresenceIndicator users={users} currentUserId={currentUserId} typingUsers={typingUsers} />

      {/* Users section */}
      <div>
        <h3 className="font-semibold text-foreground text-sm mb-3">Connected Users ({users.length})</h3>
        <div className="space-y-2">
          {users.map((user) => {
            const cursorData = userCursors?.[user.id]
            const isCurrentUser = user.id === currentUserId
            const isTyping = typingUsers.includes(user.id)

            return (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} title={user.name} />
                  {!isCurrentUser && (
                    <Circle className="w-2 h-2 absolute -top-1 -right-1 fill-green-500 text-green-500 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">{user.name}</span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        You
                      </Badge>
                    )}
                    {isTyping && (
                      <Badge variant="outline" className="text-xs flex-shrink-0 bg-accent/10">
                        typing
                      </Badge>
                    )}
                  </div>
                  {cursorData && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.color }} />
                      <span>Cursor at {cursorData.position}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity feed section */}
      <div className="pt-4 border-t border-border">
        <h3 className="font-semibold text-foreground text-sm mb-3">Activity</h3>
        <ActivityFeed activities={activities} />
      </div>

      {/* Status section */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">Status</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>✓ {users.length} user(s) connected</p>
          <p>✓ Real-time sync active</p>
          <p>✓ Operational Transform enabled</p>
        </div>
      </div>
    </div>
  )
}
