import Navigation from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">About This Project</h1>

          <div className="grid gap-8">
            <Card className="border border-border">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Educational Purpose</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  This collaborative text editor is an educational project designed to demonstrate the challenges and
                  solutions involved in building real-time collaborative applications. It showcases how multiple users
                  can edit the same document simultaneously while maintaining consistency.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Key Technologies</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground">
                  <li>Next.js 16 with React 19 for the frontend</li>
                  <li>WebSocket protocol for real-time communication</li>
                  <li>Operational Transformation for conflict resolution</li>
                  <li>TypeScript for type safety</li>
                  <li>Tailwind CSS for styling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">How It Works</h2>
                <p className="text-foreground leading-relaxed">
                  When you edit the document, your changes are sent to the server in real-time. The server applies
                  operational transformation rules to handle conflicts with simultaneous edits from other users. All
                  connected clients receive the transformed operations, ensuring everyone sees the same final document
                  state. User cursors and typing indicators provide additional context about who is editing where.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
