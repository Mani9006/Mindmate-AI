"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Zap, Clock, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Chats",
    value: "0",
    description: "All time conversations",
    icon: MessageSquare,
  },
  {
    title: "Messages",
    value: "0",
    description: "Messages exchanged",
    icon: Zap,
  },
  {
    title: "Active Time",
    value: "0h",
    description: "Time spent chatting",
    icon: Clock,
  },
  {
    title: "Productivity",
    value: "+0%",
    description: "Compared to last month",
    icon: TrendingUp,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
