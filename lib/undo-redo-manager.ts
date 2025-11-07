export interface UndoRedoState {
  content: string
  timestamp: number
  userId: string
  action: string
}

export class UndoRedoManager {
  private undoStack: UndoRedoState[] = []
  private redoStack: UndoRedoState[] = []
  private currentState: UndoRedoState

  constructor(initialContent: string) {
    this.currentState = {
      content: initialContent,
      timestamp: Date.now(),
      userId: "",
      action: "Initial state",
    }
  }

  pushState(content: string, userId: string, action: string): void {
    this.undoStack.push(this.currentState)
    this.currentState = {
      content,
      timestamp: Date.now(),
      userId,
      action,
    }
    this.redoStack = [] // Clear redo stack on new action
  }

  undo(): UndoRedoState | null {
    if (this.undoStack.length === 0) return null

    this.redoStack.push(this.currentState)
    this.currentState = this.undoStack.pop()!
    return this.currentState
  }

  redo(): UndoRedoState | null {
    if (this.redoStack.length === 0) return null

    this.undoStack.push(this.currentState)
    this.currentState = this.redoStack.pop()!
    return this.currentState
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getCurrentState(): UndoRedoState {
    return this.currentState
  }

  getHistory(): UndoRedoState[] {
    return [...this.undoStack, this.currentState]
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}
