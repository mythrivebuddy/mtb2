// /api/admin/announcement/route.ts --> POST
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      title,
      backgroundColor,
      fontColor,
      linkUrl,
      openInNewTab,
      isActive,
      audience,
      expireAt,
    } = body;

    // Validate only required fields
    if (!title || !backgroundColor || !fontColor || !audience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        backgroundColor,
        fontColor,
        linkUrl: linkUrl || null,
        openInNewTab: openInNewTab ?? false,
        isActive: isActive ?? true,
        audience,
        expireAt: expireAt ? new Date(expireAt) : null,
      },
    });

    return NextResponse.json(
      { message: "Announcement created successfully", announcement },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
};

export const GET = async () => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" }, // newest first
    });

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
};