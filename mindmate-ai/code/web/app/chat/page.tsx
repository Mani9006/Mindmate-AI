"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"

export default function ChatPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Chat"
        text="Have a conversation with AI."
      />
      <ChatInterface />
    </DashboardShell>
  )
}
