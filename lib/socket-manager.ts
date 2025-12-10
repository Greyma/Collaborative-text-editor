import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export type Operation = {
  id: string;
  type: "insert" | "delete";
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  userId: string;
  revision?: number;
};

export function initializeSocket(userId: string, userName: string, roomId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";
    
    socket = io(socketUrl, {
      query: {
        userId,
        userName,
        documentId: roomId,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log(`[Socket] Connected to room: ${roomId}`);
      if (socket) {
        // Emit join event
        socket.emit("join", {
          documentId: roomId,
          userId,
          userName,
          userColor: "#" + Math.floor(Math.random()*16777215).toString(16),
        });
        resolve(socket);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      reject(error);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });
  });
}

export function sendOperation(operation: Operation) {
  if (!socket) return;
  socket.emit("edit", { operation });
}

export function sendCursorPosition(userId: string, position: number) {
  if (!socket) return;
  socket.emit("cursor", { userId, position });
}

export function onMessage(callback: (data: any) => void) {
  if (!socket) return;
  
  // Remove all previous listeners to avoid duplicates
  socket.off("document-sync");
  socket.off("users-updated");
  socket.off("activity-update");
  socket.off("edit-received");
  socket.off("cursor-update");
  socket.off("typing-update");
  socket.off("chat-received");

  socket.on("document-sync", (data) => callback({ type: "documentState", ...data }));
  socket.on("users-updated", (data) => callback({ type: "userList", ...data }));
  socket.on("activity-update", (data) => callback({ type: "activity", ...data }));
  socket.on("edit-received", (data) => callback({ type: "operation", ...data }));
  socket.on("cursor-update", (data) => callback({ type: "cursor", ...data }));
  socket.on("typing-update", (data) => callback({ type: "typing", ...data }));
  socket.on("chat-received", (data) => callback({ type: "chat", ...data }));
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected || false;
}