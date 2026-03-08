"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ChatDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string

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
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/chat">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <DashboardHeader
          heading="Chat"
          text="Continue your conversation."
        />
      </div>
      <ChatInterface chatId={chatId} />
    </DashboardShell>
  )
}
