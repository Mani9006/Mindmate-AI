"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MessageSquare, Settings, Sparkles, FileText } from "lucide-react"

const actions = [
  {
    title: "New Chat",
    description: "Start a conversation",
    icon: MessageSquare,
    href: "/chat",
    variant: "default" as const,
  },
  {
    title: "AI Assist",
    description: "Get AI-powered help",
    icon: Sparkles,
    href: "/chat?mode=assist",
    variant: "outline" as const,
  },
  {
    title: "Documents",
    description: "Manage your files",
    icon: FileText,
    href: "/documents",
    variant: "outline" as const,
  },
  {
    title: "Settings",
    description: "Customize your experience",
    icon: Settings,
    href: "/settings",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant={action.variant}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
