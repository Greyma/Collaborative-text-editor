"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface RoomSelectorProps {
  onJoinRoom: (roomId: string, userName: string) => void
  isJoining?: boolean
}

export default function RoomSelector({ onJoinRoom, isJoining = false }: RoomSelectorProps) {
  const [roomId, setRoomId] = useState("")
  const [userName, setUserName] = useState("")
  const [mode, setMode] = useState<"select" | "create" | "join">("select")

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    setMode("create")
  }

  const handleJoinRoom = () => {
    if (roomId.trim() && userName.trim()) {
      onJoinRoom(roomId.trim(), userName.trim())
    }
  }

  const handleQuickJoin = (predefinedRoom: string) => {
    if (userName.trim()) {
      onJoinRoom(predefinedRoom, userName.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Collaborative Text Editor</CardTitle>
          <CardDescription>Join or create a room to start collaborating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "select" && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Your Name</Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleCreateRoom} variant="default" className="w-full">
                    Create New Room
                  </Button>
                  <Button onClick={() => setMode("join")} variant="outline" className="w-full">
                    Join Existing Room
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or join a public room</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleQuickJoin("public-room-1")}
                  variant="secondary"
                  className="w-full"
                  disabled={isJoining || !userName.trim()}
                >
                  Public Room #1
                </Button>
                <Button
                  onClick={() => handleQuickJoin("public-room-2")}
                  variant="secondary"
                  className="w-full"
                  disabled={isJoining || !userName.trim()}
                >
                  Public Room #2
                </Button>
                <Button
                  onClick={() => handleQuickJoin("public-room-3")}
                  variant="secondary"
                  className="w-full"
                  disabled={isJoining || !userName.trim()}
                >
                  Public Room #3
                </Button>
              </div>
            </>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Room ID</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-center font-mono text-lg font-semibold">
                  {roomId}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this ID with others to invite them to your room
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setMode("select")} variant="outline" className="w-full">
                  Back
                </Button>
                <Button onClick={handleJoinRoom} disabled={isJoining || !userName.trim()} className="w-full">
                  {isJoining ? "Connecting..." : "Create & Join"}
                </Button>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setMode("select")} variant="outline" className="w-full">
                  Back
                </Button>
                <Button onClick={handleJoinRoom} disabled={isJoining || !roomId.trim() || !userName.trim()} className="w-full">
                  {isJoining ? "Connecting..." : "Join Room"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
