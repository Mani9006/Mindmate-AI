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
import { MessageSquare, Plus } from "lucide-react"

export function ChatList() {
  // TODO: Fetch chats from API
  const chats: Array<{
    id: string
    title: string
    lastMessage: string
    updatedAt: string
  }> = []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Chats</CardTitle>
          <CardDescription>Your recent conversations</CardDescription>
        </div>
        <Link href="/chat">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chats yet</p>
            <Link href="/chat" className="mt-4">
              <Button variant="outline">Start a new chat</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{chat.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {chat.updatedAt}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
