"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RoomSelectorProps {
  onJoinRoom: (roomId: string) => void
}

export default function RoomSelector({ onJoinRoom }: RoomSelectorProps) {
  const [roomId, setRoomId] = useState("")
  const [customRoomId, setCustomRoomId] = useState("")

  const predefinedRooms = [
    { id: "general", name: "General Room", description: "Open collaboration space" },
    { id: "team-alpha", name: "Team Alpha", description: "Team Alpha workspace" },
    { id: "team-beta", name: "Team Beta", description: "Team Beta workspace" },
    { id: "private", name: "Private Room", description: "Private collaboration" },
  ]

  const handleJoinPredefined = (id: string) => {
    onJoinRoom(id)
  }

  const handleJoinCustom = () => {
    if (customRoomId.trim()) {
      onJoinRoom(customRoomId.trim())
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Select or Create a Room</CardTitle>
          <CardDescription>
            Choose a room to start collaborating with your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Predefined Rooms */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Rooms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedRooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleJoinPredefined(room.id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {room.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Room */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Create or Join Custom Room</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter room ID..."
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinCustom()}
                className="flex-1"
              />
              <Button onClick={handleJoinCustom} disabled={!customRoomId.trim()}>
                Join Room
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Enter a unique room ID to create a new room or join an existing one
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
