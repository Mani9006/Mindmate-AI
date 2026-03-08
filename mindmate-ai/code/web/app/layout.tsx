import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth/next"
import { SessionProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { authConfig } from "@/lib/auth"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MindMate AI - Your Intelligent Companion",
  description:
    "MindMate AI is an intelligent chat application powered by advanced AI models.",
  keywords: ["AI", "Chat", "Assistant", "MindMate", "OpenAI", "Claude"],
  authors: [{ name: "MindMate AI" }],
  openGraph: {
    title: "MindMate AI",
    description: "Your Intelligent AI Companion",
    type: "website",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
