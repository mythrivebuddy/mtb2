// /api/admin/announcement/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH -> update announcement
const VALID_AUDIENCES = [
  "EVERYONE",
  "PAID",
  "FREE",
  "COACH",
  "ENTHUSIAST",
] as const;
type AudienceType = (typeof VALID_AUDIENCES)[number];
function isValidAudience(value: string): value is AudienceType {
  return VALID_AUDIENCES.includes(value as AudienceType);
}
export const PATCH = async (
  request: NextRequest,
  { params }: { params: { id: string } },
) => {
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
      audiences,
      expireAt,
    } = body;

    // check if announcement exists
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    const normalizedAudiencesRaw =
      audiences && audiences.length > 0
        ? Array.from(new Set(audiences.map((a: string) => a.toUpperCase())))
        : audience
          ? [audience.toUpperCase()]
          : existing.audiences?.length > 0
            ? existing.audiences
            : ["EVERYONE"];
    if (!normalizedAudiencesRaw.every(isValidAudience)) {
      return NextResponse.json(
        { error: "Invalid audience values" },
        { status: 400 },
      );
    }

    // ✅ Now TS knows this is AudienceType[]
    const normalizedAudiences: AudienceType[] = normalizedAudiencesRaw;

    const legacyAudience: AudienceType =
      audience && isValidAudience(audience)
        ? audience
        : (normalizedAudiences.find((a) => a !== "EVERYONE") ?? "EVERYONE");
    let parsedExpireAt: Date | null | undefined = undefined;

    if (expireAt !== undefined) {
      if (!expireAt) {
        parsedExpireAt = null;
      } else {
        const date = new Date(expireAt);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Invalid expireAt date" },
            { status: 400 },
          );
        }
        parsedExpireAt = date;
      }
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

        ...(audiences !== undefined && {
          audiences: normalizedAudiences,
          audience: legacyAudience, // always sync when audiences change
        }),

        ...(parsedExpireAt !== undefined && { expireAt: parsedExpireAt }),
      },
    });

    return NextResponse.json(
      { message: "Announcement updated successfully", announcement: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 },
    );
  }
};

// DELETE -> remove announcement
export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } },
) => {
  try {
    const { id } = params;

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json(
      { message: "Announcement deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
};
