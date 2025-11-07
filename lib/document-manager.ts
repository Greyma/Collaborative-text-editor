// Document state management across multiple clients

import { DocumentState, type Operation, ConflictLog } from "./conflict-resolver"

export class DocumentManager {
  private documents: Map<string, DocumentState> = new Map()
  private documentLocks: Map<string, string> = new Map() // document -> userId with lock
  private conflictLogs: Map<string, ConflictLog> = new Map()
  private syncHistory: Map<string, Array<{ version: number; timestamp: number }>> = new Map()

  getDocument(documentId: string): DocumentState {
    if (!this.documents.has(documentId)) {
      this.documents.set(documentId, new DocumentState())
      this.conflictLogs.set(documentId, new ConflictLog())
      this.syncHistory.set(documentId, [])
    }
    return this.documents.get(documentId)!
  }

  applyOperation(documentId: string, operation: Operation): { success: boolean; error?: string } {
    const doc = this.getDocument(documentId)
    return doc.applyOperation(operation)
  }

  getConflictLog(documentId: string): ConflictLog {
    if (!this.conflictLogs.has(documentId)) {
      this.conflictLogs.set(documentId, new ConflictLog())
    }
    return this.conflictLogs.get(documentId)!
  }

  recordSync(documentId: string, version: number): void {
    if (!this.syncHistory.has(documentId)) {
      this.syncHistory.set(documentId, [])
    }
    this.syncHistory.get(documentId)!.push({
      version,
      timestamp: Date.now(),
    })
  }

  getSyncHistory(documentId: string): Array<{ version: number; timestamp: number }> {
    return this.syncHistory.get(documentId) || []
  }

  saveDocument(documentId: string, content: string): void {
    localStorage.setItem(`doc-${documentId}`, content)
    localStorage.setItem(`doc-${documentId}-timestamp`, Date.now().toString())
    console.log(`[v0] Document ${documentId} saved`)
  }

  loadDocument(documentId: string): string | null {
    return localStorage.getItem(`doc-${documentId}`)
  }

  getDocumentMetadata(documentId: string) {
    const doc = this.getDocument(documentId)
    return {
      version: doc.getVersion(),
      checksum: doc.getChecksum(),
      timestamp: localStorage.getItem(`doc-${documentId}-timestamp`) || Date.now().toString(),
      operationCount: doc.getOperations().length,
    }
  }

  lockDocument(documentId: string, userId: string): boolean {
    if (this.documentLocks.has(documentId)) {
      return false
    }
    this.documentLocks.set(documentId, userId)
    return true
  }

  unlockDocument(documentId: string, userId: string): boolean {
    const currentLock = this.documentLocks.get(documentId)
    if (currentLock === userId) {
      this.documentLocks.delete(documentId)
      return true
    }
    return false
  }
}

export const documentManager = new DocumentManager()
