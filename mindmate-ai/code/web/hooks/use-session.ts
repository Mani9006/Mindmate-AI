"use client"

import { useSession as useNextAuthSession } from "next-auth/react"
import { useAuthStore } from "@/stores"
import { useEffect } from "react"

export function useSession() {
  const { data: session, status } = useNextAuthSession()
  const { setUser, setAuthenticated, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(status === "loading")

    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name || null,
        image: session.user.image || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setAuthenticated(true)
    } else if (status === "unauthenticated") {
      setUser(null)
      setAuthenticated(false)
    }
  }, [session, status, setUser, setAuthenticated, setLoading])

  return { session, status }
}
