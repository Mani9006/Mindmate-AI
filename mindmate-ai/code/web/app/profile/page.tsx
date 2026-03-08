"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProfileForm } from "@/components/profile/profile-form"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
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
        heading="Profile"
        text="Manage your profile information."
      />
      <ProfileForm />
    </DashboardShell>
  )
}
