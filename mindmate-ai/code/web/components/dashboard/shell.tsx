"use client"

import { DashboardNav } from "@/components/dashboard/nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">MindMate AI</span>
            </Link>
            <DashboardNav />
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Search can be added here */}
            </div>
            <nav className="flex items-center space-x-2">
              <ModeToggle />
              <UserNav />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] py-6">
          {/* Sidebar Navigation (Mobile) */}
          <aside className="hidden w-[200px] flex-col md:flex">
            <DashboardNav />
          </aside>

          {/* Page Content */}
          <div className="flex-1">{children}</div>
        </div>
      </main>
    </div>
  )
}
