import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-12 text-center border border-primary/20">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Collaborate?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join other students in the editor and experience real-time synchronization in action.
        </p>
        <Link href="/editor">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Open Editor
          </Button>
        </Link>
      </div>
    </section>
  )
}
