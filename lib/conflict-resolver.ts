export interface Operation {
  type: "insert" | "delete"
  position: number
  content?: string
  timestamp: number
  userId: string
  version: number
}

export interface ConflictResolutionStrategy {
  name: "last-write-wins" | "operational-transform" | "crdt-inspired"
  resolve: (ops: Operation[]) => Operation[]
}

export class DocumentState {
  private content = ""
  private operations: Operation[] = []
  private version = 0
  private checksum = ""

  constructor(initialContent = "") {
    this.content = initialContent
    this.updateChecksum()
  }

  private updateChecksum(): void {
    // Simple checksum for integrity verification
    let hash = 0
    for (let i = 0; i < this.content.length; i++) {
      const char = this.content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    this.checksum = Math.abs(hash).toString(36)
  }

  getContent(): string {
    return this.content
  }

  getVersion(): number {
    return this.version
  }

  getChecksum(): string {
    return this.checksum
  }

  applyOperation(operation: Operation): { success: boolean; error?: string } {
    const { type, position, content: insertContent } = operation

    // Validate position
    if (position < 0 || position > this.content.length) {
      return { success: false, error: "Invalid position" }
    }

    try {
      if (type === "insert" && insertContent) {
        this.content = this.content.slice(0, position) + insertContent + this.content.slice(position)
      } else if (type === "delete" && insertContent) {
        const expectedDelete = this.content.slice(position, position + insertContent.length)
        if (expectedDelete !== insertContent) {
          return { success: false, error: "Delete content mismatch - conflict detected" }
        }
        this.content = this.content.slice(0, position) + this.content.slice(position + insertContent.length)
      }

      operation.version = this.version
      this.operations.push(operation)
      this.version++
      this.updateChecksum()

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Operational Transform: Transform incoming operation against pending operations
  transformOperation(incoming: Operation, pendingOps: Operation[]): Operation | null {
    const transformed = { ...incoming }
    let adjustedPosition = transformed.position

    for (const pending of pendingOps) {
      if (pending.userId === incoming.userId) continue

      // Both inserts at different positions
      if (pending.type === "insert" && transformed.type === "insert") {
        if (pending.position < adjustedPosition) {
          adjustedPosition += pending.content?.length || 0
        } else if (pending.position === adjustedPosition && pending.userId < incoming.userId) {
          // Tie-breaker: user ID order determines precedence
          adjustedPosition += pending.content?.length || 0
        }
      }
      // Pending insert, incoming delete
      else if (pending.type === "insert" && transformed.type === "delete") {
        if (pending.position < adjustedPosition) {
          adjustedPosition += pending.content?.length || 0
        } else if (
          pending.position >= adjustedPosition &&
          pending.position < adjustedPosition + (transformed.content?.length || 0)
        ) {
          // Insert is within delete range - conflict
          if (pending.timestamp < incoming.timestamp) {
            // Delete wins (covers the insert)
            continue
          }
        }
      }
      // Pending delete, incoming insert
      else if (pending.type === "delete" && transformed.type === "insert") {
        if (pending.position < adjustedPosition) {
          adjustedPosition -= pending.content?.length || 0
        }
      }
      // Both deletes
      else if (pending.type === "delete" && transformed.type === "delete") {
        if (pending.position < adjustedPosition) {
          adjustedPosition -= pending.content?.length || 0
        }
      }
    }

    transformed.position = Math.max(0, adjustedPosition)

    // Last-Write-Wins tiebreaker
    for (const pending of pendingOps) {
      if (pending.timestamp === transformed.timestamp && pending.userId > transformed.userId) {
        return null // Discard
      }
    }

    return transformed
  }

  resolveConflicts(strategy: ConflictResolutionStrategy): Operation[] {
    if (strategy.name === "last-write-wins") {
      return this.resolveLWW()
    } else if (strategy.name === "operational-transform") {
      return this.resolveOT()
    }
    return this.operations
  }

  private resolveLWW(): Operation[] {
    // Sort by timestamp (newer first), then by userId
    return [...this.operations].sort((a, b) => {
      if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp
      return b.userId.localeCompare(a.userId)
    })
  }

  private resolveOT(): Operation[] {
    const resolved: Operation[] = []

    for (const op of this.operations) {
      const transformed = this.transformOperation(op, resolved)
      if (transformed) {
        resolved.push(transformed)
      }
    }

    return resolved
  }

  getOperations(): Operation[] {
    return [...this.operations]
  }

  getOperationsSince(version: number): Operation[] {
    return this.operations.filter((op) => op.version >= version)
  }
}

export function detectConflict(op1: Operation, op2: Operation): boolean {
  if (op1.type === "insert" && op2.type === "insert") {
    return op1.position === op2.position && op1.timestamp === op2.timestamp
  }

  if (op1.type === "delete" && op2.type === "delete") {
    const op1End = op1.position + (op1.content?.length || 0)
    const op2End = op2.position + (op2.content?.length || 0)
    return !(op1End <= op2.position || op2End <= op1.position)
  }

  // Insert + Delete conflict
  if (op1.type === "insert" && op2.type === "delete") {
    const deleteEnd = op2.position + (op2.content?.length || 0)
    return op1.position >= op2.position && op1.position <= deleteEnd
  }

  if (op1.type === "delete" && op2.type === "insert") {
    const deleteEnd = op1.position + (op1.content?.length || 0)
    return op2.position >= op1.position && op2.position <= deleteEnd
  }

  return false
}

export class ConflictLog {
  private conflicts: Array<{ op1: Operation; op2: Operation; resolution: string; timestamp: number }> = []

  logConflict(op1: Operation, op2: Operation, resolution: string): void {
    this.conflicts.push({
      op1,
      op2,
      resolution,
      timestamp: Date.now(),
    })
  }

  getConflicts(): typeof this.conflicts {
    return [...this.conflicts]
  }

  getConflictRate(): number {
    return this.conflicts.length
  }

  clear(): void {
    this.conflicts = []
  }
}
