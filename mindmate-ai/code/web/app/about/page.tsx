import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">MindMate AI</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container py-12 md:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                About MindMate AI
              </h1>
              <p className="text-xl text-muted-foreground">
                Empowering conversations through artificial intelligence
              </p>
            </div>

            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                MindMate AI is an intelligent chat application designed to help
                you work smarter, create faster, and achieve more. Built on
                cutting-edge AI technology, we provide a seamless conversational
                experience that understands context and delivers meaningful
                responses.
              </p>

              <p>
                Our mission is to make AI accessible to everyone. Whether
                you&apos;re a developer looking for code assistance, a writer seeking
                creative inspiration, or a professional needing help with
                research, MindMate AI is here to help.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8">
                Our Values
              </h2>

              <ul className="space-y-4 list-disc list-inside">
                <li>
                  <strong className="text-foreground">Innovation:</strong> We
                  constantly push the boundaries of what&apos;s possible with AI.
                </li>
                <li>
                  <strong className="text-foreground">Privacy:</strong> Your
                  data is yours. We prioritize security and privacy in everything
                  we do.
                </li>
                <li>
                  <strong className="text-foreground">Accessibility:</strong> AI
                  should be available to everyone, regardless of technical
                  expertise.
                </li>
                <li>
                  <strong className="text-foreground">Transparency:</strong> We
                  believe in being open about how our technology works.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8">
                Get in Touch
              </h2>

              <p>
                Have questions or feedback? We&apos;d love to hear from you. Reach
                out to us at{" "}
                <a
                  href="mailto:support@mindmate.ai"
                  className="text-primary hover:underline"
                >
                  support@mindmate.ai
                </a>
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Link href="/register">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by MindMate AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
