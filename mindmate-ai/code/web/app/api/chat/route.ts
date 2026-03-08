import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth"

// GET /api/chat - Get all chats for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // TODO: Fetch chats from database
    // const chats = await db.chat.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { updatedAt: "desc" },
    //   include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    // })

    // Mock data for now
    const chats = [
      {
        id: "1",
        title: "Getting Started",
        userId: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ]

    return NextResponse.json({ success: true, data: chats })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}

// POST /api/chat - Create a new chat
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title = "New Chat" } = body

    // TODO: Create chat in database
    // const chat = await db.chat.create({
    //   data: {
    //     title,
    //     userId: session.user.id,
    //   },
    // })

    // Mock response
    const chat = {
      id: Math.random().toString(36).substring(7),
      title,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    }

    return NextResponse.json({ success: true, data: chat }, { status: 201 })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
