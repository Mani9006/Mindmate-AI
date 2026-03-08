import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "/month",
    features: [
      "5 chats per day",
      "Basic AI models",
      "Chat history (7 days)",
      "Email support",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For power users",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited chats",
      "Advanced AI models (GPT-4, Claude)",
      "Unlimited chat history",
      "Priority support",
      "Custom instructions",
      "API access",
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "SSO & advanced security",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
]

export default function PricingPage() {
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
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that&apos;s right for you. All plans include a 14-day
                free trial.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`flex flex-col ${
                    plan.highlighted
                      ? "border-primary shadow-lg scale-105"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href={plan.href} className="w-full">
                      <Button
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="max-w-2xl mx-auto space-y-4 text-left">
                <div>
                  <h3 className="font-semibold">Can I change plans anytime?</h3>
                  <p className="text-muted-foreground">
                    Yes, you can upgrade or downgrade your plan at any time.
                    Changes take effect immediately.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards, PayPal, and bank transfers
                    for enterprise plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Is there a refund policy?</h3>
                  <p className="text-muted-foreground">
                    Yes, we offer a 30-day money-back guarantee for all paid
                    plans.
                  </p>
                </div>
              </div>
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
