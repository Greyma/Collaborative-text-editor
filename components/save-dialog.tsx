"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SaveDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  documentId: string
}

export default function SaveDialog({ isOpen, onClose, onSave, documentId }: SaveDialogProps) {
  const [name, setName] = useState(`document-${new Date().toISOString().split("T")[0]}`)

  const handleSave = () => {
    if (name.trim()) {
      onSave(name)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Document</DialogTitle>
          <DialogDescription>Give your document a name to save it for later</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Document"
              className="mt-2"
              autoFocus
            />
          </div>

          <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Saved to Browser Storage</p>
            <p>This document will be saved locally. Share the document link to collaborate.</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
