import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
          Real-Time Collaborative Text Editing
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-balance">
          Experience the power of distributed state management and conflict resolution. Learn how multiple users can
          edit the same document in perfect synchronization.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/editor">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Editing
            </Button>
          </Link>
          <Link href="/learn">
            <Button size="lg" variant="outline">
              Learn How It Works
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
