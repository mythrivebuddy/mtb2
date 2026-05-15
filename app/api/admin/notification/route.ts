import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  try {
    const { type, name, title, message, url, audiences } = await req.json();

    if (!type || !name || !title || !message) {
      return NextResponse.json(
        { error: "Type, name, title, and message are required" },
        { status: 400 },
      );
    }
    const validAudiences = ["USER", "ADMIN", "COACH"];

    if (
      !Array.isArray(audiences) ||
      audiences.some((a) => !validAudiences.includes(a))
    ) {
      return NextResponse.json({ error: "Invalid audiences" }, { status: 400 });
    }

    const data = await prisma.notificationSettings.upsert({
      where: { notification_type: type },
      update: {
        title,
        name,
        message,
        url: url ?? null,
        audiences,
      },
      create: {
        notification_type: type,
        name,
        title,
        message,
        url: url ?? null,
        audiences,
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
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
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
