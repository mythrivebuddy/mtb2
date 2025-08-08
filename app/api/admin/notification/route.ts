import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

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

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type) {
      const template = await prisma.notificationSettings.findUnique({
        where: { notification_type: type as NotificationType },
      });
      return NextResponse.json({ data: template || null }, { status: 200 });
    }

    // If no type param → fetch all
    const templates = await prisma.notificationSettings.findMany();
    return NextResponse.json({ data: templates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notification(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
