import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Users, Lock, Gauge } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Real-Time Sync",
      description: "Edits propagate instantly across all connected clients with WebSocket communication.",
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description: "See colored cursors and avatars of all users editing the document simultaneously.",
    },
    {
      icon: Lock,
      title: "Conflict Resolution",
      description: "Intelligent handling of simultaneous edits using operational transformation.",
    },
    {
      icon: Gauge,
      title: "Learn Distributed Systems",
      description: "Educational content explaining network protocols, state synchronization, and consensus.",
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="border border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <feature.icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
