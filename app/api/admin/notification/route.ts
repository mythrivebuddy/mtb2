import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const POST = async (req: NextRequest) => {
  try {
    const { type, title, message } = await req.json()

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Type, title, and message are required" },
        { status: 400 }
      )
    }

    const data = await prisma.notificationSettings.upsert({
      where: { notification_type: type },
      update: {
        title,
        message,
      },
      create: {
        notification_type: type,
        title,
        message,
      },
    })

    return NextResponse.json(
      { message: "Notification template saved", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error to set notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
