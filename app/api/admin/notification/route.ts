import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  try {
    const { type, title, message, url } = await req.json();

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Type, title, and message are required" },
        { status: 400 },
      );
    }

    const data = await prisma.notificationSettings.upsert({
      where: { notification_type: type },
      update: {
        title,
        message,
        url: url ?? null,
      },
      create: {
        notification_type: type,
        title,
        message,
        url: url ?? null,
      },
    });

    return NextResponse.json(
      { message: "Notification template saved", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error to set notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const normalize = (str: string) => str.toLowerCase().replace(/[\s_]+/g, "");

    const enumMatch = Object.values(NotificationType).filter((type) =>
      normalize(type).includes(normalize(search)),
    );

    const where: Prisma.NotificationSettingsWhereInput = search
      ? {
          OR: [
            ...(enumMatch.length > 0
              ? [{ notification_type: { in: enumMatch } }]
              : []),

            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              message: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const [templates, total] = await Promise.all([
      prisma.notificationSettings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { notification_type: "asc" },
      }),
      prisma.notificationSettings.count({ where }),
    ]);

    return NextResponse.json({
      data: templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching notification(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
