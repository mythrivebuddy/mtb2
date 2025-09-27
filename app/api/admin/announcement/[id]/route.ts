// /api/admin/announcement/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH -> update announcement
export const PATCH = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = await params;
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

    // check if announcement exists
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(fontColor !== undefined && { fontColor }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(openInNewTab !== undefined && { openInNewTab }),
        ...(isActive !== undefined && { isActive }),
        ...(audience !== undefined && { audience }),
        ...(expireAt !== undefined && { expireAt: expireAt ? new Date(expireAt) : null }),
      },
    });

    return NextResponse.json(
      { message: "Announcement updated successfully", announcement: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
};

// DELETE -> remove announcement
export const DELETE = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json(
      { message: "Announcement deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
};
