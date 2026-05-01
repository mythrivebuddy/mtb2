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
      audience, // old legacy
       audiences,   //NEw
      expireAt,
    } = body;

    // Validate only required fields
    if (!title || !backgroundColor || !fontColor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
   const normalizedAudiences =
  audiences && audiences.length > 0
    ? Array.from(new Set(audiences)) // ✅ dedupe
    : audience
      ? [audience]
      : ["EVERYONE"];
      const VALID_AUDIENCES = ["EVERYONE", "PAID", "FREE", "COACH", "ENTHUSIAST"];

const isValid = normalizedAudiences.every(a =>
  VALID_AUDIENCES.includes(a)
);

if (!isValid) {
  return NextResponse.json(
    { error: "Invalid audience values" },
    { status: 400 }
  );
}

      const legacyAudience =
  audience ??
  normalizedAudiences.find((a) => a !== "EVERYONE") ??
  "EVERYONE";

    const announcement = await prisma.announcement.create({
      data: {
        title,
        backgroundColor,
        fontColor,
        linkUrl: linkUrl || null,
        openInNewTab: openInNewTab ?? false,
        isActive: isActive ?? true,
          audience: legacyAudience, // legacy safe
    audiences: normalizedAudiences,       // new 
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