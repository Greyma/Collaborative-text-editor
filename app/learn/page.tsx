import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LearnPage() {
  const concepts = [
    {
      title: "Real-Time Synchronization",
      description: "How changes are instantly broadcast to all connected clients using WebSocket connections.",
      content:
        "WebSockets establish a persistent connection between client and server, enabling bidirectional communication. When one user edits text, the change is captured, transformed if needed, and broadcast to all other clients.",
    },
    {
      title: "Distributed State Management",
      description: "Managing document state across multiple machines without a single point of truth.",
      content:
        "Each client maintains a local copy of the document state. Edits are sent as operations (insert, delete) with metadata. The server coordinates these operations and ensures all clients converge to the same state.",
    },
    {
      title: "Conflict Resolution",
      description: "Handling simultaneous edits from different users on the same content.",
      content:
        "When two users edit at the same position, conflicts arise. Common strategies: Last-Write-Wins (simple), Operational Transformation (complex), or CRDT (conflict-free). This editor uses operational transformation with timestamps.",
    },
    {
      title: "TCP vs UDP",
      description: "Understanding the difference between reliable and unreliable protocols.",
      content:
        "TCP ensures ordered, reliable delivery of messages (like WebSocket). UDP is faster but provides no guarantees. WebSocket uses TCP underneath, ensuring no edits are lost.",
    },
    {
      title: "Consensus Algorithms",
      description: "How systems agree on a single truth in the presence of failures.",
      content:
        "Simple consensus: the server is the authority. More complex: Raft, Paxos, Byzantine Fault Tolerance. For our editor, the server acts as the single source of truth for edit ordering.",
    },
    {
      title: "Cursor Tracking",
      description: "Displaying other users' cursor positions and selections in real-time.",
      content:
        "Each user's cursor position is sent to the server with edit operations. The server broadcasts cursor positions to all clients, allowing you to see where others are editing.",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Learn: Collaborative Systems</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Understanding the concepts behind real-time collaborative editing
          </p>

          <div className="grid gap-6">
            {concepts.map((concept, idx) => (
              <Card key={idx} className="border border-border">
                <CardHeader>
                  <CardTitle>{concept.title}</CardTitle>
                  <CardDescription>{concept.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{concept.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
