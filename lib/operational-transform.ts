export type Operation = {
  id: string
  type: "insert" | "delete"
  position: number
  content?: string
  length?: number
  timestamp: number
  userId: string
  revision?: number // Track operation order
}

export type DocumentState = {
  content: string
  revision: number
  lastOperationTime: number
}

export function applyOperation(text: string, operation: Operation): string {
  if (operation.type === "insert" && operation.content) {
    if (operation.position > text.length) {
      console.warn(`[v0] Insert position ${operation.position} exceeds text length ${text.length}, clamping`)
      const pos = Math.min(operation.position, text.length)
      return text.slice(0, pos) + operation.content + text.slice(pos)
    }
    return text.slice(0, operation.position) + operation.content + text.slice(operation.position)
  } else if (operation.type === "delete" && operation.length) {
    if (operation.position > text.length) {
      return text
    }
    const endPos = Math.min(operation.position + operation.length, text.length)
    return text.slice(0, operation.position) + text.slice(endPos)
  }
  return text
}

// Describes any text change as a deletion and/or an insertion at the first differing position.
export function createOperations(oldText: string, newText: string, userId: string): Operation[] {
  const maxPrefix = Math.min(oldText.length, newText.length)
  let prefix = 0
  while (prefix < maxPrefix && oldText[prefix] === newText[prefix]) prefix++

  const maxSuffix = maxPrefix - prefix
  let suffix = 0
  while (suffix < maxSuffix && oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]) suffix++

  const deletedLength = oldText.length - prefix - suffix
  const insertedText = newText.slice(prefix, newText.length - suffix)
  const timestamp = Date.now()
  const operations: Operation[] = []

  if (deletedLength > 0) {
    operations.push({ id: `${userId}-${timestamp}-delete`, type: "delete", position: prefix, length: deletedLength, timestamp, userId })
  }
  if (insertedText) {
    operations.push({ id: `${userId}-${timestamp}-insert`, type: "insert", position: prefix, content: insertedText, timestamp, userId })
  }
  return operations
}

export function transformOperation(op1: Operation, op2: Operation): Operation {
  // Transform op1 against op2 using operational transformation principles
  // Ensures both clients converge to the same state

  if (op1.type === "insert" && op2.type === "insert") {
    // Both inserting
    if (op1.position < op2.position) {
      return op1 // op1 comes before op2, no change needed
    } else if (op1.position > op2.position) {
      // op2 shifts op1 right
      return {
        ...op1,
        position: op1.position + (op2.content?.length || 0),
      }
    } else {
      // Same position - use user ID as tiebreaker for deterministic ordering
      const tiebreak = op1.userId.localeCompare(op2.userId)
      if (tiebreak < 0) {
        // op1 comes first
        return op1
      } else if (tiebreak > 0) {
        // op2 comes first, shift op1
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        }
      } else {
        // Same user - use timestamp as fallback
        if (op1.timestamp <= op2.timestamp) {
          return op1
        } else {
          return {
            ...op1,
            position: op1.position + (op2.content?.length || 0),
          }
        }
      }
    }
  } else if (op1.type === "delete" && op2.type === "insert") {
    // op1 deleting, op2 inserting
    if (op1.position < op2.position) {
      return op1 // Deletion before insertion
    } else if (op1.position >= op2.position) {
      // Shift deletion right
      return {
        ...op1,
        position: op1.position + (op2.content?.length || 0),
      }
    }
  } else if (op1.type === "insert" && op2.type === "delete") {
    // op1 inserting, op2 deleting
    if (op1.position <= op2.position) {
      return op1 // Insertion before deletion starts
    } else if (op1.position < op2.position + (op2.length || 0)) {
      // Insertion is within deletion range - shift left, but not past deletion start
      return {
        ...op1,
        position: Math.max(op2.position, op1.position - (op2.length || 0)),
      }
    } else {
      // Insertion after deletion
      return {
        ...op1,
        position: op1.position - (op2.length || 0),
      }
    }
  } else if (op1.type === "delete" && op2.type === "delete") {
    // Both deleting - careful to avoid double-deletion
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)

    if (op1End <= op2.position) {
      // op1 completely before op2
      return op1
    } else if (op1.position >= op2End) {
      // op1 completely after op2
      return {
        ...op1,
        position: Math.max(op2.position, op1.position - (op2.length || 0)),
      }
    } else {
      // Overlapping deletions - reduce op1 length
      const overlap = Math.min(op1End, op2End) - Math.max(op1.position, op2.position)
      return {
        ...op1,
        length: Math.max(0, (op1.length || 0) - overlap),
        position: op1.position < op2.position ? op1.position : Math.max(op2.position, op1.position - (op2.length || 0)),
      }
    }
  }

  return op1
}

export function invertOperation(operation: Operation): Operation {
  if (operation.type === "insert") {
    return {
      ...operation,
      type: "delete",
      length: operation.content?.length,
      content: undefined,
    }
  } else {
    return {
      ...operation,
      type: "insert",
      content: "", // Note: In production, store original content for undo
    }
  }
}

export function transformOperationAgainstHistory(operation: Operation, history: Operation[]): Operation {
  let transformed = operation
  for (const historyOp of history) {
    transformed = transformOperation(transformed, historyOp)
  }
  return transformed
}

export function isValidOperation(operation: Operation, text: string): boolean {
  if (operation.type === "insert") {
    return operation.position >= 0 && operation.position <= text.length && operation.content !== undefined
  } else if (operation.type === "delete") {
    return (
      operation.position >= 0 &&
      operation.position + (operation.length || 0) <= text.length &&
      operation.length !== undefined &&
      operation.length > 0
    )
  }
  return false
}
