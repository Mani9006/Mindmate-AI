"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { ChatList } from "@/components/dashboard/chat-list"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
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
          <Skeleton className="h-10 w-[250px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your activity."
      />
      <div className="grid gap-6">
        <StatsCards />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-2">
            <ChatList />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
