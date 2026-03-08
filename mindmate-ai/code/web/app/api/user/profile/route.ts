import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth"

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // TODO: Fetch user from database
    // const user = await db.user.findUnique({
    //   where: { id: session.user.id },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     image: true,
    //     createdAt: true,
    //   },
    // })

    // Mock response
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/user/profile - Update user profile
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
    const { name, image } = body

    // TODO: Update user in database
    // const user = await db.user.update({
    //   where: { id: session.user.id },
    //   data: { name, image },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     image: true,
    //     createdAt: true,
    //   },
    // })

    // Mock response
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: name || session.user.name,
      image: image || session.user.image,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user profile" },
      { status: 500 }
    )
  }
}
