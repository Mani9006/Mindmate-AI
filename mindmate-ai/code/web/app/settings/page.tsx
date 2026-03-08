"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { SettingsForm } from "@/components/settings/settings-form"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
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
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      />
      <SettingsForm />
    </DashboardShell>
  )
}
