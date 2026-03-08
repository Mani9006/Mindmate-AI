import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth"

// GET /api/user/settings - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // TODO: Fetch settings from database
    // const settings = await db.settings.findUnique({
    //   where: { userId: session.user.id },
    // })

    // Mock response with default settings
    const settings = {
      theme: "system",
      language: "en",
      notifications: true,
      autoSave: true,
      defaultModel: "gpt-4",
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch user settings" },
      { status: 500 }
    )
  }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    // TODO: Update settings in database
    // const settings = await db.settings.upsert({
    //   where: { userId: session.user.id },
    //   create: { userId: session.user.id, ...body },
    //   update: body,
    // })

    // Mock response
    const settings = {
      theme: body.theme || "system",
      language: body.language || "en",
      notifications: body.notifications ?? true,
      autoSave: body.autoSave ?? true,
      defaultModel: body.defaultModel || "gpt-4",
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user settings" },
      { status: 500 }
    )
  }
}
