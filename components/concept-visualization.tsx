"use client"

import { useState } from "react"

interface ConceptVisualizationProps {
  algorithm: "ot" | "lww" | "crdt"
}

export default function ConceptVisualization({ algorithm }: ConceptVisualizationProps) {
  const [step, setStep] = useState(0)

  const scenarios = {
    ot: [
      { title: "Initial State", doc: "Hello", desc: "Both users start with same text" },
      { title: "User A Operation", doc: "Hello", desc: "User A inserts 'x' at position 1", highlight: "A" },
      { title: "User B Operation", doc: "Hello", desc: "User B deletes at position 3", highlight: "B" },
      { title: "A's View (transformed)", doc: "Hxello", desc: "A's insert applied first" },
      { title: "B's View (transformed)", doc: "Hxelo", desc: "B's delete transformed against A's insert" },
      { title: "Consistent State", doc: "Hxelo", desc: "Both clients converge to same state" },
    ],
    lww: [
      { title: "Initial State", doc: "Hello", desc: "Both users start with same text" },
      { title: "User A edits (10ms)", doc: "Hello", desc: "Timestamp: 10ms", highlight: "A" },
      { title: "User B edits (15ms)", doc: "Hello", desc: "Timestamp: 15ms", highlight: "B" },
      { title: "Conflict!", doc: "???", desc: "Both operations at different positions" },
      { title: "LWW Decision", doc: "B wins", desc: "User B's timestamp is newer (15ms > 10ms)" },
      { title: "Final State", doc: "B's result", desc: "A's change discarded" },
    ],
    crdt: [
      { title: "Replica A", doc: "A:{1:'H'}", desc: "Each character has unique ID" },
      { title: "Replica B", doc: "B:{1:'H'}", desc: "Same ID format" },
      { title: "A inserts", doc: "A:{1:'H',2:'i'}", desc: "Insert doesn't require coordination" },
      { title: "B inserts", doc: "B:{1:'H',3:'j'}", desc: "Independent insert at B" },
      { title: "A receives B", doc: "A→AB:{1,3,2}", desc: "Merge based on IDs" },
      { title: "Convergent", doc: "Same at both", desc: "Automatic convergence guaranteed" },
    ],
  }

  const current = scenarios[algorithm][step]

  const handleNext = () => {
    setStep((prev) => (prev + 1) % scenarios[algorithm].length)
  }

  const handlePrev = () => {
    setStep((prev) => (prev - 1 + scenarios[algorithm].length) % scenarios[algorithm].length)
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-foreground mb-2">{current.title}</h4>
          <div className="bg-background border-2 border-primary/50 rounded p-4 font-mono text-2xl font-bold text-primary mb-4 min-h-[3rem] flex items-center justify-center">
            {current.doc}
          </div>
          <p className="text-sm text-muted-foreground">{current.desc}</p>
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handlePrev}
            className="px-4 py-2 bg-background border border-border rounded hover:bg-muted transition-colors text-sm font-medium"
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {scenarios[algorithm].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${idx === step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors text-sm font-medium"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Step {step + 1} of {scenarios[algorithm].length}
      </div>
    </div>
  )
}
