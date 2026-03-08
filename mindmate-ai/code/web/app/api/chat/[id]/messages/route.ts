import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth"

// GET /api/chat/[id]/messages - Get all messages for a chat
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    // TODO: Fetch messages from database
    // const messages = await db.message.findMany({
    //   where: { chatId: id },
    //   orderBy: { createdAt: "asc" },
    // })

    // Mock response
    const messages = [
      {
        id: "1",
        content: "Hello! How can I help you today?",
        role: "assistant",
        chatId: id,
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST /api/chat/[id]/messages - Add a message to a chat
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { content, role = "user" } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      )
    }

    // TODO: Save message to database
    // const message = await db.message.create({
    //   data: {
    //     content,
    //     role,
    //     chatId: id,
    //   },
    // })

    // Mock response
    const message = {
      id: Math.random().toString(36).substring(7),
      content,
      role,
      chatId: id,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create message" },
      { status: 500 }
    )
  }
}
