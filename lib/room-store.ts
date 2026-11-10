import { mkdirSync } from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "rooms.db")
mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new DatabaseSync(databasePath)
db.exec("PRAGMA journal_mode = WAL")
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    room_id    TEXT PRIMARY KEY,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

const selectRoom = db.prepare("SELECT content, created_at FROM rooms WHERE room_id = ?")
const upsertRoom = db.prepare(`
  INSERT INTO rooms (room_id, content, created_at, updated_at)
  VALUES (@roomId, @content, @createdAt, @updatedAt)
  ON CONFLICT(room_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
`)

export function loadRoom(roomId: string): { content: string; createdAt: Date } | undefined {
  const row = selectRoom.get(roomId) as unknown as { content: string; created_at: string } | undefined
  return row && { content: row.content, createdAt: new Date(row.created_at) }
}

export function saveRoom(roomId: string, content: string, createdAt: Date): void {
  upsertRoom.run({
    roomId,
    content,
    createdAt: createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export function closeRoomStore(): void {
  db.close()
}
