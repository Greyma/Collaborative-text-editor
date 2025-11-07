import type { Operation } from "./operational-transform"
import { applyOperation, isValidOperation } from "./operational-transform"

export type ClientState = {
  userId: string
  userName: string
  color: string
  lastSeen: number
  cursor?: number
}

export type DocumentSyncState = {
  content: string
  revision: number
  operationHistory: Operation[]
  clients: Map<string, ClientState>
}

export class SyncManager {
  private state: DocumentSyncState = {
    content: "",
    revision: 0,
    operationHistory: [],
    clients: new Map(),
  }

  private clientPendingOps: Map<string, Operation[]> = new Map()

  getDocumentState() {
    return {
      content: this.state.content,
      revision: this.state.revision,
      users: Array.from(this.state.clients.values()),
    }
  }

  addClient(userId: string, userName: string, color: string) {
    this.state.clients.set(userId, {
      userId,
      userName,
      color,
      lastSeen: Date.now(),
    })
    console.log(`[v0] Client added: ${userId}`)
  }

  removeClient(userId: string) {
    this.state.clients.delete(userId)
    this.clientPendingOps.delete(userId)
    console.log(`[v0] Client removed: ${userId}`)
  }

  updateClientCursor(userId: string, position: number) {
    const client = this.state.clients.get(userId)
    if (client) {
      client.cursor = position
      client.lastSeen = Date.now()
    }
  }

  // Apply operation after transforming against pending operations
  applyOperation(operation: Operation): { success: boolean; error?: string } {
    // Validate operation
    if (!isValidOperation(operation, this.state.content)) {
      return {
        success: false,
        error: `Invalid operation: position ${operation.position} out of bounds for text length ${this.state.content.length}`,
      }
    }

    // Transform against pending operations from other clients
    let transformedOp = operation
    for (const historyOp of this.state.operationHistory.slice(-50)) {
      // Only check recent history for performance
      if (historyOp.id !== operation.id) {
        // Dynamic transformation using import
        const { transformOperation } = require("./operational-transform")
        transformedOp = transformOperation(transformedOp, historyOp)
      }
    }

    // Apply the transformed operation
    const newContent = applyOperation(this.state.content, transformedOp)

    // Update state
    this.state.content = newContent
    this.state.operationHistory.push(transformedOp)
    this.state.revision++

    console.log(`[v0] Operation applied: ${transformedOp.id}, new revision: ${this.state.revision}`)

    return { success: true }
  }

  getOperationsSince(revision: number): Operation[] {
    return this.state.operationHistory.slice(revision)
  }

  getFullHistory(): Operation[] {
    return this.state.operationHistory
  }

  getClientState(userId: string) {
    return this.state.clients.get(userId)
  }

  getAllClients(): ClientState[] {
    return Array.from(this.state.clients.values())
  }
}

// Singleton instance for server-side state
export const globalSyncManager = new SyncManager()
