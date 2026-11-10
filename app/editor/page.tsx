
"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import EditorContent from "@/components/editor-content";
import UsersList from "@/components/users-list";
import TypingIndicator from "@/components/typing-indicator";
import RoomSelector from "@/components/room-selector";
import { initializeSocket, sendOperation, onMessage, closeSocket, type Operation } from "@/lib/socket-manager";
import { applyOperation, transformOperation, isValidOperation } from "@/lib/operational-transform";
import { getUserId } from "@/lib/user-id";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  color: string;
}

interface CursorData {
  position: number;
  color: string;
  name: string;
}

export default function EditorPage() {
  const [documentText, setDocumentText] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [userCursors, setUserCursors] = useState<Record<string, CursorData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const joiningRef = useRef(false);
  const operationHistoryRef = useRef<Operation[]>([]);
  const userColorsRef = useRef<Record<string, string>>({});

  const handleJoinRoom = async (roomId: string, userName: string) => {
    // A ref, because clicks can land before the isJoining state has re-rendered.
    if (joiningRef.current) return;
    joiningRef.current = true;
    setIsJoining(true);

    const userId = getUserId(userName);

    setCurrentUserId(userId);
    setCurrentUserName(userName);
    setCurrentRoomId(roomId);

    try {
      await initializeSocket(userId, userName, roomId);
      setIsConnected(true);
      setHasJoinedRoom(true);
      console.log(`[Editor] Joined room: ${roomId} as ${userName}`);

      onMessage((data) => {
        console.log("[Editor] Received message:", data);

        if (data.type === "documentState") {
          setDocumentText(data.content);
          setConnectedUsers(data.users || []);
          operationHistoryRef.current = data.operations || [];
          data.users?.forEach((user: User) => {
            userColorsRef.current[user.id] = user.color;
          });
        } else if (data.type === "userList") {
          setConnectedUsers(data.users || []);
          data.users?.forEach((user: User) => {
            if (!userColorsRef.current[user.id]) {
              userColorsRef.current[user.id] = "#" + Math.floor(Math.random()*16777215).toString(16);
            }
          });
        } else if (data.type === "operation") {
          handleRemoteOperation(data.operation);
        } else if (data.type === "cursor") {
          if (data.userId !== userId) {
            const cursorData: CursorData = {
              position: data.position,
              color: userColorsRef.current[data.userId] || "#3B82F6",
              name: data.userName || "User",
            };
            setUserCursors((prev) => ({
              ...prev,
              [data.userId]: cursorData,
            }));
          }
        } else if (data.type === "typing") {
          if (data.userId !== userId) {
            setTypingUsers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
            }, 1500);
          }
        }
      });
    } catch (error) {
      console.error("[Editor] Failed to join room:", error);
    } finally {
      joiningRef.current = false;
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    closeSocket();
    setHasJoinedRoom(false);
    setIsConnected(false);
    setDocumentText("");
    setConnectedUsers([]);
    setTypingUsers([]);
    setUserCursors({});
    operationHistoryRef.current = [];
  };

  useEffect(() => {
    return () => {
      closeSocket();
    };
  }, []);

  const handleRemoteOperation = useCallback((remoteOp: Operation) => {
    setDocumentText((prev) => {
      if (!isValidOperation(remoteOp, prev)) {
        console.warn("[v0] Invalid operation received, skipping", remoteOp);
        return prev;
      }
      const newText = applyOperation(prev, remoteOp);
      operationHistoryRef.current.push(remoteOp);
      return newText;
    });
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const oldText = documentText;
    const cursorPos = e.currentTarget.selectionStart;

    let op: Operation | null = null;

    if (newText.length > oldText.length) {
      const diff = newText.length - oldText.length;
      const insertedText = newText.substring(Math.max(0, cursorPos - diff), cursorPos);
      op = {
        id: `${currentUserId}-${Date.now()}`,
        type: "insert",
        position: cursorPos - insertedText.length,
        content: insertedText,
        timestamp: Date.now(),
        userId: currentUserId,
      };
    } else if (newText.length < oldText.length) {
      const deletedLength = oldText.length - newText.length;
      op = {
        id: `${currentUserId}-${Date.now()}`,
        type: "delete",
        position: cursorPos,
        length: deletedLength,
        timestamp: Date.now(),
        userId: currentUserId,
      };
    }

    if (op) {
      sendOperation(op);
      operationHistoryRef.current.push(op);
    }

    setDocumentText(newText);
  };

  if (!hasJoinedRoom) {
    return <RoomSelector onJoinRoom={handleJoinRoom} isJoining={isJoining} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border p-4 bg-card">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collaborative Document</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isConnected ? (
                <>
                  <span className="text-green-600 font-semibold">● Connected</span> • Room: <span className="font-mono font-semibold">{currentRoomId}</span> • {Array.isArray(connectedUsers) ? connectedUsers.length : 0} user(s) editing
                </>
              ) : (
                <span className="text-yellow-600 font-semibold">● Connecting...</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-muted-foreground">
              <p>{documentText.length} characters</p>
              <p>{documentText.split("\n").length} lines</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <EditorContent
          text={documentText}
          onChange={handleTextChange}
          currentUserId={currentUserId}
          userCursors={userCursors}
        />
        <div className="w-64 border-l border-border bg-card flex flex-col overflow-hidden">
          <UsersList users={connectedUsers} currentUserId={currentUserId} userCursors={userCursors} />
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers.filter((id) => id !== currentUserId)} users={connectedUsers} />
          )}
        </div>
      </div>
    </div>
  );
}
