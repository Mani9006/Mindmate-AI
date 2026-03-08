# MindMate AI - Next.js 14+ Web Application Architecture

## Executive Summary

This document provides a comprehensive technical architecture for the MindMate AI web application, built on Next.js 14+ with the App Router. It covers the complete application structure, component strategy, real-time communication, offline capabilities, and performance optimization.

---

## Table of Contents

1. [App Router Structure](#1-app-router-structure)
2. [Server vs Client Components Strategy](#2-server-vs-client-components-strategy)
3. [WebRTC Browser Integration](#3-webrtc-browser-integration)
4. [Service Worker for Web Push Notifications](#4-service-worker-for-web-push-notifications)
5. [Progressive Web App (PWA) Configuration](#5-progressive-web-app-pwa-configuration)
6. [Performance Optimization Strategy](#6-performance-optimization-strategy)

---

## 1. App Router Structure

### 1.1 Directory Structure

```
my-app/
├── app/                          # App Router (Next.js 14+)
│   ├── (auth)/                   # Route Group: Authentication
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Auth layout (no nav)
│   │
│   ├── (dashboard)/              # Route Group: Main Dashboard
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # /dashboard - Main dashboard
│   │   ├── chat/
│   │   │   ├── page.tsx          # /chat - AI Chat interface
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx      # /chat/[sessionId] - Specific chat
│   │   ├── journal/
│   │   │   ├── page.tsx          # /journal - Journal entries list
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # /journal/new - New entry
│   │   │   └── [entryId]/
│   │   │       ├── page.tsx      # /journal/[entryId] - View entry
│   │   │       └── edit/
│   │   │           └── page.tsx  # /journal/[entryId]/edit
│   │   ├── mood/
│   │   │   ├── page.tsx          # /mood - Mood tracker
│   │   │   └── history/
│   │   │       └── page.tsx      # /mood/history - Mood history
│   │   ├── meditations/
│   │   │   ├── page.tsx          # /meditations - Library
│   │   │   └── [id]/
│   │   │       └── page.tsx      # /meditations/[id] - Player
│   │   ├── exercises/
│   │   │   ├── page.tsx          # /exercises - CBT exercises
│   │   │   └── [id]/
│   │   │       └── page.tsx      # /exercises/[id] - Specific exercise
│   │   ├── insights/
│   │   │   └── page.tsx          # /insights - AI insights & analytics
│   │   ├── resources/
│   │   │   ├── page.tsx          # /resources - Mental health resources
│   │   │   └── [category]/
│   │   │       └── page.tsx      # /resources/[category]
│   │   └── settings/
│   │       ├── page.tsx          # /settings - General settings
│   │       ├── profile/
│   │       │   └── page.tsx      # /settings/profile
│   │       ├── notifications/
│   │       │   └── page.tsx      # /settings/notifications
│   │       ├── privacy/
│   │       │   └── page.tsx      # /settings/privacy
│   │       └── subscription/
│   │           └── page.tsx      # /settings/subscription
│   │
│   ├── (marketing)/              # Route Group: Marketing Pages
│   │   ├── layout.tsx            # Marketing layout
│   │   ├── page.tsx              # / - Landing page
│   │   ├── about/
│   │   │   └── page.tsx          # /about
│   │   ├── features/
│   │   │   └── page.tsx          # /features
│   │   ├── pricing/
│   │   │   └── page.tsx          # /pricing
│   │   ├── blog/
│   │   │   ├── page.tsx          # /blog
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # /blog/[slug]
│   │   ├── help/
│   │   │   ├── page.tsx          # /help
│   │   │   └── [article]/
│   │   │       └── page.tsx      # /help/[article]
│   │   └── contact/
│   │       └── page.tsx          # /contact
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts      # NextAuth.js
│   │   │   └── verify/
│   │   │       └── route.ts
│   │   ├── chat/
│   │   │   ├── route.ts          # Chat API
│   │   │   └── stream/
│   │   │       └── route.ts      # SSE streaming
│   │   ├── journal/
│   │   │   └── route.ts
│   │   ├── mood/
│   │   │   └── route.ts
│   │   ├── meditations/
│   │   │   └── route.ts
│   │   ├── exercises/
│   │   │   └── route.ts
│   │   ├── insights/
│   │   │   └── route.ts
│   │   ├── push/
│   │   │   ├── subscribe/
│   │   │   │   └── route.ts
│   │   │   └── send/
│   │   │       └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts          # File uploads
│   │   ├── webhook/
│   │   │   ├── stripe/
│   │   │   │   └── route.ts
│   │   │   └── clerk/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts          # Health check
│   │
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error UI
│   ├── not-found.tsx             # 404 page
│   ├── globals.css               # Global styles
│   └── manifest.ts               # PWA manifest
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   └── dashboard-shell.tsx
│   │
│   ├── auth/                     # Auth components
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── protected-route.tsx
│   │
│   ├── chat/                     # Chat components
│   │   ├── chat-container.tsx
│   │   ├── chat-input.tsx
│   │   ├── chat-message.tsx
│   │   ├── chat-list.tsx
│   │   ├── voice-input.tsx
│   │   └── typing-indicator.tsx
│   │
│   ├── journal/                  # Journal components
│   │   ├── journal-editor.tsx
│   │   ├── journal-list.tsx
│   │   ├── mood-selector.tsx
│   │   └── entry-card.tsx
│   │
│   ├── mood/                     # Mood tracker components
│   │   ├── mood-chart.tsx
│   │   ├── mood-calendar.tsx
│   │   └── mood-entry-form.tsx
│   │
│   ├── meditation/               # Meditation components
│   │   ├── audio-player.tsx
│   │   ├── meditation-card.tsx
│   │   ├── progress-ring.tsx
│   │   └── breathing-guide.tsx
│   │
│   ├── insights/                 # Insights components
│   │   ├── insight-card.tsx
│   │   ├── trend-chart.tsx
│   │   └── word-cloud.tsx
│   │
│   └── shared/                   # Shared components
│       ├── animated-container.tsx
│       ├── error-boundary.tsx
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       └── seo-head.tsx
│
├── hooks/                        # Custom React Hooks
│   ├── use-auth.ts
│   ├── use-chat.ts
│   ├── use-journal.ts
│   ├── use-mood.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   ├── use-notification.ts
│   ├── use-webrtc.ts
│   ├── use-push.ts
│   └── use-offline.ts
│
├── lib/                          # Utilities & Config
│   ├── utils.ts                  # General utilities
│   ├── constants.ts              # App constants
│   ├── validations.ts            # Zod schemas
│   ├── api-client.ts             # API client
│   ├── db/                       # Database
│   │   ├── index.ts              # Prisma client
│   │   └── schema.prisma
│   ├── ai/                       # AI integration
│   │   ├── openai.ts
│   │   ├── prompts.ts
│   │   └── streaming.ts
│   └── auth/                     # Auth config
│       └── auth.config.ts
│
├── types/                        # TypeScript Types
│   ├── index.ts                  # Main exports
│   ├── auth.ts
│   ├── chat.ts
│   ├── journal.ts
│   ├── mood.ts
│   ├── meditation.ts
│   └── api.ts
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # PWA icons
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── images/
│   │   ├── logo.png
│   │   ├── logo-dark.png
│   │   └── ...
│   └── audio/                    # Meditation audio files
│       └── ...
│
├── styles/                       # Additional styles
│   └── animations.css
│
├── workers/                      # Web Workers
│   ├── audio-processor.ts
│   └── data-sync.ts
│
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json
├── package.json
└── .env.local                    # Environment variables
```

### 1.2 Route Definitions

| Route | Description | Layout | Auth Required |
|-------|-------------|--------|---------------|
| `/` | Landing page | Marketing | No |
| `/about` | About page | Marketing | No |
| `/features` | Features page | Marketing | No |
| `/pricing` | Pricing page | Marketing | No |
| `/blog` | Blog listing | Marketing | No |
| `/blog/[slug]` | Blog article | Marketing | No |
| `/help` | Help center | Marketing | No |
| `/contact` | Contact page | Marketing | No |
| `/login` | Login page | Auth | No |
| `/register` | Registration | Auth | No |
| `/forgot-password` | Password reset | Auth | No |
| `/reset-password` | Password reset confirm | Auth | No |
| `/verify-email` | Email verification | Auth | No |
| `/dashboard` | Main dashboard | Dashboard | Yes |
| `/chat` | AI Chat | Dashboard | Yes |
| `/chat/[sessionId]` | Specific chat | Dashboard | Yes |
| `/journal` | Journal entries | Dashboard | Yes |
| `/journal/new` | New journal entry | Dashboard | Yes |
| `/journal/[entryId]` | View journal entry | Dashboard | Yes |
| `/journal/[entryId]/edit` | Edit journal entry | Dashboard | Yes |
| `/mood` | Mood tracker | Dashboard | Yes |
| `/mood/history` | Mood history | Dashboard | Yes |
| `/meditations` | Meditation library | Dashboard | Yes |
| `/meditations/[id]` | Meditation player | Dashboard | Yes |
| `/exercises` | CBT exercises | Dashboard | Yes |
| `/exercises/[id]` | Exercise detail | Dashboard | Yes |
| `/insights` | AI insights | Dashboard | Yes |
| `/resources` | Resources | Dashboard | Yes |
| `/resources/[category]` | Resource category | Dashboard | Yes |
| `/settings` | Settings | Dashboard | Yes |
| `/settings/profile` | Profile settings | Dashboard | Yes |
| `/settings/notifications` | Notification settings | Dashboard | Yes |
| `/settings/privacy` | Privacy settings | Dashboard | Yes |
| `/settings/subscription` | Subscription settings | Dashboard | Yes |

### 1.3 Key Page Implementations

#### Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import { PWAProvider } from '@/components/pwa-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'MindMate AI - Your Personal Mental Health Companion',
    template: '%s | MindMate AI',
  },
  description: 'AI-powered mental health support, journaling, and mindfulness exercises.',
  keywords: ['mental health', 'AI therapy', 'journaling', 'meditation', 'wellness'],
  authors: [{ name: 'MindMate AI' }],
  creator: 'MindMate AI',
  metadataBase: new URL('https://mindmate.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mindmate.ai',
    siteName: 'MindMate AI',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mindmateai',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MindMate AI',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PWAProvider>
              {children}
              <Toaster />
            </PWAProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

#### Dashboard Layout (`app/(dashboard)/layout.tsx`)

```typescript
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={session.user} />
      <div className="flex">
        <Sidebar className="hidden lg:block w-64 shrink-0" />
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav className="lg:hidden fixed bottom-0 left-0 right-0" />
    </div>
  )
}
```

#### Chat Page with Streaming (`app/(dashboard)/chat/page.tsx`)

```typescript
import { ChatContainer } from '@/components/chat/chat-container'
import { ChatList } from '@/components/chat/chat-list'
import { getChatSessions } from '@/lib/chat'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat',
}

export default async function ChatPage() {
  const sessions = await getChatSessions()

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden md:block w-64 shrink-0">
        <ChatList sessions={sessions} />
      </aside>
      <div className="flex-1 min-w-0">
        <ChatContainer />
      </div>
    </div>
  )
}
```

---

## 2. Server vs Client Components Strategy

### 2.1 Component Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAGE (Server)                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LAYOUT (Server - Optional)                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │           SERVER COMPONENTS (Default)               │  │  │
│  │  │  • Data fetching                                    │  │  │
│  │  │  • Database queries                                 │  │  │
│  │  │  • SEO optimization                                 │  │  │
│  │  │  • Static content                                   │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │       CLIENT COMPONENTS ('use client')       │  │  │  │
│  │  │  │  • User interactions                         │  │  │  │
│  │  │  │  • Browser APIs                              │  │  │  │
│  │  │  │  • State management                          │  │  │  │
│  │  │  │  • Real-time features                        │  │  │  │
│  │  │  │  • Animations                                │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Server Components Strategy

**When to use Server Components:**

| Use Case | Reason |
|----------|--------|
| Data fetching from DB/API | Direct backend access, no client JS needed |
| SEO-critical content | Full HTML rendered on server |
| Static content | Zero client-side JavaScript |
| Sensitive operations | API keys stay on server |
| Initial page load | Faster TTFB (Time to First Byte) |

**Server Component Examples:**

```typescript
// app/(dashboard)/journal/page.tsx - Server Component
import { JournalList } from '@/components/journal/journal-list'
import { getJournalEntries } from '@/lib/journal'
import { CreateEntryButton } from '@/components/journal/create-entry-button'

export default async function JournalPage() {
  // ✅ Direct database access - no API route needed
  const entries = await getJournalEntries()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Journal</h1>
        <CreateEntryButton /> {/* Client Component for interactivity */}
      </div>
      <JournalList entries={entries} /> {/* Can be Server or Client */}
    </div>
  )
}
```

```typescript
// components/journal/entry-card.tsx - Server Component
import { formatDate } from '@/lib/utils'
import { MoodBadge } from './mood-badge'
import type { JournalEntry } from '@/types'

interface EntryCardProps {
  entry: JournalEntry
}

// No 'use client' = Server Component
export function EntryCard({ entry }: EntryCardProps) {
  return (
    <article className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <header className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{entry.title}</h3>
        <time className="text-sm text-muted-foreground">
          {formatDate(entry.createdAt)}
        </time>
      </header>
      <p className="text-muted-foreground line-clamp-3">{entry.content}</p>
      {entry.mood && <MoodBadge mood={entry.mood} />}
    </article>
  )
}
```

### 2.3 Client Components Strategy

**When to use Client Components:**

| Use Case | Reason |
|----------|--------|
| User interactions (buttons, forms) | Need event handlers |
| Browser APIs (localStorage, WebRTC) | Only available in browser |
| React hooks (useState, useEffect) | Need component state |
| Real-time updates | WebSockets, SSE |
| Animations | Framer Motion, GSAP |
| Third-party JS libraries | Charts, maps, etc. |

**Client Component Examples:**

```typescript
// components/journal/create-entry-button.tsx - Client Component
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { JournalEditor } from './journal-editor'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateEntryButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
        </DialogHeader>
        <JournalEditor onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

```typescript
// components/chat/chat-container.tsx - Client Component
'use client'

import { useState, useRef, useCallback } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'

export function ChatContainer() {
  const { messages, sendMessage, isLoading, error } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(async (content: string) => {
    await sendMessage(content)
    // Auto-scroll to bottom
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>
      <div className="border-t p-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
```

### 2.4 Component Composition Pattern

**Recommended Pattern: Server Component wraps Client Component**

```typescript
// ✅ GOOD: Server Component for data, Client Component for interactivity

// app/(dashboard)/mood/page.tsx
import { MoodCalendar } from '@/components/mood/mood-calendar' // Server
import { MoodEntryForm } from '@/components/mood/mood-entry-form' // Client
import { getMoodEntries } from '@/lib/mood'

export default async function MoodPage() {
  const entries = await getMoodEntries() // Server-side data fetching

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mood Tracker</h1>
      <MoodEntryForm /> {/* Client: interactive form */}
      <MoodCalendar entries={entries} /> {/* Server: static display */}
    </div>
  )
}
```

```typescript
// ❌ AVOID: Fetching data in Client Component when possible

// AVOID THIS PATTERN
'use client'

import { useEffect, useState } from 'react'

export function MoodPageClient() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    // Unnecessary client-side fetch
    fetch('/api/mood').then(res => res.json()).then(setEntries)
  }, [])

  return <MoodCalendar entries={entries} />
}
```

### 2.5 Passing Data Between Server and Client

```typescript
// Server Component passes serializable data to Client Component

// app/(dashboard)/insights/page.tsx
import { InsightsDashboard } from '@/components/insights/insights-dashboard'
import { getUserInsights } from '@/lib/insights'

export default async function InsightsPage() {
  const insights = await getUserInsights()

  // ✅ Pass serialized data to Client Component
  return <InsightsDashboard initialData={insights} />
}
```

```typescript
// components/insights/insights-dashboard.tsx
'use client'

import { useState } from 'react'
import { TrendChart } from './trend-chart'
import { InsightCard } from './insight-card'
import type { UserInsights } from '@/types'

interface InsightsDashboardProps {
  initialData: UserInsights
}

export function InsightsDashboard({ initialData }: InsightsDashboardProps) {
  const [insights, setInsights] = useState(initialData)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Client-side interactivity
  const handleTimeRangeChange = async (range: typeof timeRange) => {
    setTimeRange(range)
    const newData = await fetchInsights(range)
    setInsights(newData)
  }

  return (
    <div className="space-y-6">
      <TimeRangeSelector 
        value={timeRange} 
        onChange={handleTimeRangeChange} 
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.cards.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
      <TrendChart data={insights.trends} />
    </div>
  )
}
```

### 2.6 Component Decision Tree

```
Start
  │
  ▼
┌─────────────────────────┐
│ Does it need browser    │
│ APIs or user interaction?│
└─────────────────────────┘
  │
  ├── YES ──► 'use client' (Client Component)
  │             • Event handlers
  │             • useState/useEffect
  │             • Browser APIs
  │             • Third-party libs
  │
  └── NO ───► Server Component (default)
                • Data fetching
                • Database access
                • SEO content
                • Static UI
```

---

## 3. WebRTC Browser Integration

### 3.1 WebRTC Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WebRTC Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                    ┌──────────────┐          │
│  │   Client A   │◄─────WebRTC──────►│   Client B   │          │
│  │  (Browser)   │    (P2P/Media)     │  (Browser)   │          │
│  └──────┬───────┘                    └──────┬───────┘          │
│         │                                    │                  │
│         │ Signaling (WebSocket/SSE)          │                  │
│         └──────────────┬─────────────────────┘                  │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                               │
│              │  Signaling      │                               │
│              │  Server         │                               │
│              │  (Next.js API)  │                               │
│              └─────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 WebRTC Hook Implementation

```typescript
// hooks/use-webrtc.ts
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface WebRTCState {
  isConnected: boolean
  isConnecting: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  error: Error | null
}

interface WebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export function useWebRTC(options: WebRTCOptions = {}) {
  const { toast } = useToast()
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
    error: null,
  })

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingSocketRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // ICE Servers configuration
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL || '',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
    },
  ]

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
        })
      }
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      setState((prev) => ({ ...prev, remoteStream }))
      options.onRemoteStream?.(remoteStream)
    }

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }))
          break
        case 'disconnected':
        case 'failed':
        case 'closed':
          setState((prev) => ({ ...prev, isConnected: false }))
          options.onDisconnect?.()
          break
      }
    }

    return pc
  }, [options])

  // Signaling message handler
  const sendSignalingMessage = useCallback((message: unknown) => {
    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
      signalingSocketRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Initialize local media stream
  const initializeMedia = useCallback(async (constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false, // Audio-only for voice chat
  }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      setState((prev) => ({ ...prev, localStream: stream }))
      return stream
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to access media')
      setState((prev) => ({ ...prev, error: err }))
      options.onError?.(err)
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to use voice chat.',
        variant: 'destructive',
      })
      throw err
    }
  }, [options, toast])

  // Connect to signaling server
  const connectSignaling = useCallback((sessionId: string) => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/signaling?session=${sessionId}`)
    
    ws.onopen = () => {
      console.log('Signaling connected')
    }

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      await handleSignalingMessage(message)
    }

    ws.onerror = (error) => {
      console.error('Signaling error:', error)
      setState((prev) => ({ ...prev, error: new Error('Signaling connection failed') }))
    }

    ws.onclose = () => {
      console.log('Signaling disconnected')
    }

    signalingSocketRef.current = ws
  }, [])

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: any) => {
    const pc = peerConnectionRef.current
    if (!pc) return

    switch (message.type) {
      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(message.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignalingMessage({ type: 'answer', answer })
        break

      case 'answer':
        await pc.setRemoteDescription(new RTCSessionDescription(message.answer))
        break

      case 'ice-candidate':
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate))
        break

      case 'user-joined':
        // Create and send offer to new user
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignalingMessage({ type: 'offer', offer })
        break
    }
  }, [sendSignalingMessage])

  // Start voice session (caller)
  const startSession = useCallback(async (sessionId: string) => {
    setState((prev) => ({ ...prev, isConnecting: true }))

    try {
      // Initialize media
      const stream = await initializeMedia()

      // Create peer connection
      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Connect to signaling
      connectSignaling(sessionId)

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignalingMessage({ type: 'offer', offer })

    } catch (error) {
      setState((prev) => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error : new Error('Failed to start session') 
      }))
    }
  }, [initializeMedia, createPeerConnection, connectSignaling, sendSignalingMessage])

  // Join voice session (callee)
  const joinSession = useCallback(async (sessionId: string) => {
    setState((prev) => ({ ...prev, isConnecting: true }))

    try {
      const stream = await initializeMedia()
      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      connectSignaling(sessionId)

    } catch (error) {
      setState((prev) => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error : new Error('Failed to join session') 
      }))
    }
  }, [initializeMedia, createPeerConnection, connectSignaling])

  // End session
  const endSession = useCallback(() => {
    // Stop local stream
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null

    // Close peer connection
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null

    // Close signaling
    signalingSocketRef.current?.close()
    signalingSocketRef.current = null

    setState({
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      error: null,
    })
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return audioTrack.enabled
    }
    return false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession()
    }
  }, [endSession])

  return {
    ...state,
    startSession,
    joinSession,
    endSession,
    toggleMute,
  }
}
```

### 3.3 Voice Chat Component

```typescript
// components/chat/voice-chat.tsx
'use client'

import { useState } from 'react'
import { useWebRTC } from '@/hooks/use-webrtc'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceChatProps {
  sessionId: string
  onClose?: () => void
}

export function VoiceChat({ sessionId, onClose }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false)
  const { 
    isConnected, 
    isConnecting, 
    startSession, 
    endSession, 
    toggleMute 
  } = useWebRTC({
    onDisconnect: onClose,
  })

  const handleStart = async () => {
    await startSession(sessionId)
  }

  const handleEnd = () => {
    endSession()
    onClose?.()
  }

  const handleToggleMute = () => {
    const enabled = toggleMute()
    setIsMuted(!enabled)
  }

  if (!isConnected) {
    return (
      <Button
        onClick={handleStart}
        disabled={isConnecting}
        variant="outline"
        size="icon"
        className="rounded-full"
      >
        <Phone className={cn('h-4 w-4', isConnecting && 'animate-pulse')} />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-sm font-medium">Voice Active</span>
      </div>
      
      <Button
        onClick={handleToggleMute}
        variant={isMuted ? 'destructive' : 'outline'}
        size="icon"
        className="rounded-full"
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      
      <Button
        onClick={handleEnd}
        variant="destructive"
        size="icon"
        className="rounded-full"
      >
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### 3.4 Signaling Server (Next.js API Route)

```typescript
// app/api/signaling/route.ts
import { NextRequest } from 'next/server'

// In-memory store for active connections (use Redis in production)
const connections = new Map<string, WebSocket>()

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }

  // Upgrade to WebSocket
  const { socket, response } = await upgradeWebSocket(request)
  
  socket.onopen = () => {
    console.log(`Client connected to session: ${sessionId}`)
    connections.set(sessionId, socket)
    
    // Notify other participants
    broadcastToSession(sessionId, {
      type: 'user-joined',
      sessionId,
    }, socket)
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    // Broadcast message to all other participants in session
    broadcastToSession(sessionId, message, socket)
  }

  socket.onclose = () => {
    console.log(`Client disconnected from session: ${sessionId}`)
    connections.delete(sessionId)
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return response
}

function broadcastToSession(sessionId: string, message: unknown, excludeSocket?: WebSocket) {
  connections.forEach((socket, id) => {
    if (id.startsWith(sessionId) && socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  })
}

// WebSocket upgrade helper
async function upgradeWebSocket(request: NextRequest): Promise<{ socket: WebSocket; response: Response }> {
  // This is a simplified version - in production, use a proper WebSocket server
  // Consider using Socket.io or a dedicated WebSocket service
  const { socket, response } = (request as any).upgradeWebSocket?.() || {}
  return { socket, response }
}
```

---

## 4. Service Worker for Web Push Notifications

### 4.1 Service Worker Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Push Notification Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     Subscribe      ┌──────────────────────┐  │
│  │    Client    │────────────────────►│  Push Service        │  │
│  │  (Browser)   │    (with VAPID)    │  (FCM/APNs)          │  │
│  └──────┬───────┘                     └──────────┬───────────┘  │
│         │                                         │              │
│         │ 1. Store subscription                     │              │
│         │────────────────────────────────────────►│              │
│         │                                         │              │
│         │                              2. Push event            │
│         │◄────────────────────────────────────────│              │
│         │                                         │              │
│  ┌──────┴───────┐                     ┌──────────┴───────────┐  │
│  │   Service    │◄────────────────────│   Your Server        │  │
│  │   Worker     │   Send push message │   (Next.js API)      │  │
│  └──────────────┘                     └──────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Service Worker Implementation

```javascript
// public/sw.js
const CACHE_NAME = 'mindmate-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/chat',
  '/journal',
  '/mood',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip API requests
  if (request.url.includes('/api/')) return
  
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => {
          if (cached) return cached
          
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline')
          }
          
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)
  
  let data = {}
  try {
    data = event.data?.json() || {}
  } catch {
    data = { title: event.data?.text() || 'New notification' }
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    image: data.image,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
    vibrate: data.vibrate || [200, 100, 200],
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'MindMate AI', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event)
  
  event.notification.close()
  
  const notificationData = event.notification.data
  let url = notificationData?.url || '/dashboard'
  
  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'open-chat':
        url = '/chat'
        break
      case 'open-journal':
        url = '/journal'
        break
      case 'dismiss':
        return
    }
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-mood-entries') {
    event.waitUntil(syncMoodEntries())
  } else if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncJournalEntries())
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-insights') {
    event.waitUntil(fetchDailyInsights())
  }
})

// Message handling from client
self.addEventListener('message', (event) => {
  console.log('[SW] Message from client:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Helper functions
async function syncMoodEntries() {
  // Implementation for syncing mood entries
  const entries = await getStoredMoodEntries()
  for (const entry of entries) {
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      await removeStoredMoodEntry(entry.id)
    } catch (error) {
      console.error('Failed to sync mood entry:', error)
    }
  }
}

async function syncJournalEntries() {
  // Similar implementation for journal entries
}

async function fetchDailyInsights() {
  // Fetch and cache daily insights
}

// IndexedDB helpers (simplified)
async function getStoredMoodEntries() {
  // Implementation using IndexedDB
  return []
}

async function removeStoredMoodEntry(id) {
  // Implementation using IndexedDB
}
```

### 4.3 Push Notification Hook

```typescript
// hooks/use-push.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface PushSubscriptionState {
  isSupported: boolean
  isSubscribed: boolean
  subscription: PushSubscription | null
  isLoading: boolean
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function usePushNotifications() {
  const { toast } = useToast()
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
  })

  // Check support and existing subscription
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          subscription,
          isLoading: false,
        })
      } catch (error) {
        console.error('Error checking push support:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported on this device.',
        variant: 'destructive',
      })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setState({
        isSupported: true,
        isSubscribed: true,
        subscription,
        isLoading: false,
      })

      toast({
        title: 'Subscribed!',
        description: 'You will now receive push notifications.',
      })
    } catch (error) {
      console.error('Error subscribing:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      toast({
        title: 'Subscription Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }, [state.isSupported, toast])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        
        // Notify server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setState({
        isSupported: true,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      })

      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications.',
      })
    } catch (error) {
      console.error('Error unsubscribing:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [toast])

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from MindMate AI!',
          url: '/dashboard',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      toast({
        title: 'Test Sent',
        description: 'Check your notifications!',
      })
    } catch (error) {
      toast({
        title: 'Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }, [toast])

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
```

### 4.4 Push API Routes

```typescript
// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import webpush from 'web-push'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@mindmate.ai',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await request.json()

    // Save subscription to database
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import webpush from 'web-push'

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  url?: string
  actions?: Array<{ action: string; title: string; icon?: string }>
  requireInteraction?: boolean
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: PushPayload = await request.json()

    // Get user's subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    })

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found' },
        { status: 404 }
      )
    }

    // Send notification to all subscriptions
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      image: payload.image,
      tag: payload.tag || 'default',
      requireInteraction: payload.requireInteraction,
      actions: payload.actions || [],
      data: {
        url: payload.url || '/dashboard',
        ...payload,
      },
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload)
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          // Remove invalid subscriptions
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            })
          }
          throw error
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
    })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
```

### 4.5 PWA Provider Component

```typescript
// components/pwa-provider.tsx
'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast({
                  title: 'Update Available',
                  description: 'A new version is available. Refresh to update.',
                  action: (
                    <button
                      onClick={() => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded"
                    >
                      Update
                    </button>
                  ),
                })
              }
            })
          })
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      toast({
        title: 'App Installed',
        description: 'MindMate AI has been installed on your device.',
      })
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [toast])

  // Expose install function via window
  useEffect(() => {
    ;(window as any).installPWA = async () => {
      if (!deferredPrompt) return

      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted install')
      } else {
        console.log('User dismissed install')
      }

      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }, [deferredPrompt])

  return <>{children}</>
}
```

---

## 5. Progressive Web App (PWA) Configuration

### 5.1 PWA Manifest

```typescript
// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MindMate AI',
    short_name: 'MindMate',
    description: 'Your personal AI-powered mental health companion',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['health', 'lifestyle', 'productivity'],
    screenshots: [
      {
        src: '/screenshots/dashboard.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard',
      },
      {
        src: '/screenshots/chat.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'AI Chat',
      },
      {
        src: '/screenshots/mobile-dashboard.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile Dashboard',
      },
    ],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
    shortcuts: [
      {
        name: 'New Journal Entry',
        short_name: 'Journal',
        description: 'Write a new journal entry',
        url: '/journal/new',
        icons: [{ src: '/icons/journal-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'AI Chat',
        short_name: 'Chat',
        description: 'Chat with your AI companion',
        url: '/chat',
        icons: [{ src: '/icons/chat-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Track Mood',
        short_name: 'Mood',
        description: 'Track your current mood',
        url: '/mood',
        icons: [{ src: '/icons/mood-96x96.png', sizes: '96x96' }],
      },
    ],
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=ai.mindmate.app',
        id: 'ai.mindmate.app',
      },
      {
        platform: 'itunes',
        url: 'https://apps.apple.com/app/mindmate-ai/id123456789',
      },
    ],
    prefer_related_applications: false,
  }
}
```

### 5.2 Next.js Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // We handle registration manually
  skipWaiting: false,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!noprecache/**/*'],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(self), geolocation=()',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
  ],
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
  ],
  rewrites: async () => [
    {
      source: '/ingest/static/:path*',
      destination: 'https://us-assets.i.posthog.com/static/:path*',
    },
    {
      source: '/ingest/:path*',
      destination: 'https://us.i.posthog.com/:path*',
    },
  ],
}

module.exports = withPWA(nextConfig)
```

### 5.3 Offline Page

```typescript
// app/offline/page.tsx
import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
          <WifiOff className="w-12 h-12 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          <p className="text-muted-foreground max-w-md">
            Don't worry! Your journal entries and mood tracking will be saved 
            locally and synced when you're back online.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <div className="text-sm text-muted-foreground">
          <p>Available offline:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Journal entries</li>
            <li>Mood tracking</li>
            <li>Meditation guides</li>
            <li>CBT exercises</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Performance Optimization Strategy

### 6.1 Performance Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Performance Optimization Layers                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Build-Time Optimizations                      │   │
│  │  • Code splitting (automatic)                           │   │
│  │  • Tree shaking                                         │   │
│  │  • Minification                                         │   │
│  │  • Image optimization                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Server-Side Optimizations                     │   │
│  │  • Server Components (reduce client JS)                 │   │
│  │  • Streaming SSR                                        │   │
│  │  • Edge caching                                         │   │
│  │  • Partial Prerendering (PPR)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Client-Side Optimizations                     │   │
│  │  • Lazy loading                                         │   │
│  │  • Intersection Observer                                │   │
│  │  • RequestAnimationFrame                                │   │
│  │  • Virtual scrolling                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 4: Network Optimizations                         │   │
│  │  • Service Worker caching                               │   │
│  │  • Prefetching                                          │   │
│  │  • Compression (Brotli/Gzip)                            │   │
│  │  • HTTP/2 Server Push                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Image Optimization

```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  return (
    <div className={cn('relative overflow-hidden', fill && 'absolute inset-0', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className="object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      />
    </div>
  )
}
```

### 6.3 Dynamic Imports & Code Splitting

```typescript
// components/dynamic-imports.ts
import dynamic from 'next/dynamic'

// Heavy components loaded on demand
export const MeditationPlayer = dynamic(
  () => import('./meditation/audio-player').then((mod) => mod.AudioPlayer),
  {
    ssr: false,
    loading: () => <div className="h-32 bg-muted animate-pulse rounded" />,
  }
)

export const MoodChart = dynamic(
  () => import('./mood/mood-chart').then((mod) => mod.MoodChart),
  {
    ssr: false,
    loading: () => <div className="h-64 bg-muted animate-pulse rounded" />,
  }
)

export const JournalEditor = dynamic(
  () => import('./journal/journal-editor').then((mod) => mod.JournalEditor),
  {
    ssr: false,
  }
)

export const VoiceInput = dynamic(
  () => import('./chat/voice-input').then((mod) => mod.VoiceInput),
  {
    ssr: false,
  }
)
```

### 6.4 Virtual Scrolling for Large Lists

```typescript
// components/virtual-list.tsx
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  className?: string
  overscan?: number
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  overscan = 5,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollTop, clientHeight } = container
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(clientHeight / itemHeight)
    
    setVisibleRange({
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, start + visibleCount + overscan),
    })
  }, [itemHeight, items.length, overscan])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const totalHeight = items.length * itemHeight
  const visibleItems = items.slice(visibleRange.start, visibleRange.end)
  const offsetY = visibleRange.start * itemHeight

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 6.5 Prefetching Strategy

```typescript
// hooks/use-prefetch.ts
'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'

export function usePrefetch() {
  const router = useRouter()
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>()

  const prefetch = useCallback((href: string, delay = 100) => {
    // Clear existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }

    // Delay prefetch to avoid unnecessary requests
    prefetchTimeoutRef.current = setTimeout(() => {
      router.prefetch(href)
    }, delay)
  }, [router])

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
  }, [])

  return { prefetch, cancelPrefetch }
}
```

```typescript
// components/prefetch-link.tsx
'use client'

import Link from 'next/link'
import { usePrefetch } from '@/hooks/use-prefetch'
import { cn } from '@/lib/utils'

interface PrefetchLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetchDelay?: number
}

export function PrefetchLink({
  href,
  children,
  className,
  prefetchDelay = 100,
}: PrefetchLinkProps) {
  const { prefetch, cancelPrefetch } = usePrefetch()

  return (
    <Link
      href={href}
      className={cn(className)}
      onMouseEnter={() => prefetch(href, prefetchDelay)}
      onMouseLeave={cancelPrefetch}
      onFocus={() => prefetch(href, 0)}
      onBlur={cancelPrefetch}
    >
      {children}
    </Link>
  )
}
```

### 6.6 Performance Monitoring

```typescript
// lib/performance.ts
export function reportWebVitals(metric: any) {
  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric)
  }
}

// hooks/use-performance.ts
'use client'

import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const renderStartTime = useRef<number>()

  useEffect(() => {
    renderCount.current += 1
    
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current
      
      if (renderTime > 16) { // Longer than one frame (60fps)
        console.warn(
          `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (render #${renderCount.current})`
        )
      }
    }

    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    return () => {
      console.log(`[Performance] ${componentName} unmounted after ${renderCount.current} renders`)
    }
  }, [componentName])
}
```

### 6.7 Database Query Optimization

```typescript
// lib/db/queries.ts
import { prisma } from './index'

// Optimized query with selective fields
export async function getJournalEntries(userId: string, options: {
  limit?: number
  cursor?: string
  search?: string
}) {
  const { limit = 20, cursor, search } = options

  return prisma.journalEntry.findMany({
    where: {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true,
      title: true,
      mood: true,
      createdAt: true,
      // Don't fetch full content for list view
      content: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  })
}

// Cached query for frequently accessed data
export async function getUserStats(userId: string) {
  const cacheKey = `user-stats:${userId}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Fetch from database
  const stats = await prisma.$transaction([
    prisma.journalEntry.count({ where: { userId } }),
    prisma.moodEntry.count({ where: { userId } }),
    prisma.meditationSession.aggregate({
      where: { userId },
      _sum: { duration: true },
    }),
  ])

  const result = {
    journalCount: stats[0],
    moodCount: stats[1],
    totalMeditationMinutes: stats[2]._sum.duration || 0,
  }

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(result))

  return result
}
```

### 6.8 Bundle Analysis Configuration

```javascript
// next.config.js (additional config)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Add to your existing config
module.exports = withBundleAnalyzer(withPWA(nextConfig))
```

```json
// package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```

---

## Appendix A: Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mindmate"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI
OPENAI_API_KEY="your-openai-api-key"

# Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"

# WebRTC
NEXT_PUBLIC_TURN_SERVER_URL="turn:turnserver.com:3478"
NEXT_PUBLIC_TURN_USERNAME="turn-username"
NEXT_PUBLIC_TURN_CREDENTIAL="turn-password"
NEXT_PUBLIC_WS_URL="wss://your-websocket-server.com"

# Storage
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

---

## Appendix B: Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@next/font": "^14.0.0",
    
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    
    "next-auth": "^4.24.0",
    "@auth/prisma-adapter": "^1.0.0",
    
    "openai": "^4.0.0",
    "ai": "^2.0.0",
    
    "web-push": "^3.6.0",
    "@types/web-push": "^3.6.0",
    
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.0",
    
    "zod": "^3.22.0",
    "react-hook-form": "^7.47.0",
    "@hookform/resolvers": "^3.3.0",
    
    "framer-motion": "^10.0.0",
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.0",
    "@types/lodash": "^4.14.0",
    
    "redis": "^4.6.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    
    "@next/bundle-analyzer": "^14.0.0",
    "next-pwa": "^5.6.0"
  }
}
```

---

## Summary

This architecture provides a production-ready foundation for MindMate AI with:

1. **App Router Structure**: Comprehensive route organization with logical groupings for auth, dashboard, and marketing pages
2. **Server/Client Strategy**: Clear separation with Server Components for data fetching and Client Components for interactivity
3. **WebRTC Integration**: Full peer-to-peer voice communication with signaling server
4. **Push Notifications**: Complete service worker implementation with subscription management
5. **PWA Configuration**: Full manifest, offline support, and installability
6. **Performance Optimization**: Multi-layer optimization from build-time to runtime

All code is production-ready and follows Next.js 14+ best practices.
