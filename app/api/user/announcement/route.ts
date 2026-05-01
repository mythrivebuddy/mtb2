// /api/user/announcement/route.ts

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "../../auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";

type AudienceType =
  | "EVERYONE"
  | "FREE"
  | "PAID"
  | "COACH"
  | "ENTHUSIAST";

export const GET = async () => {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        membership: true, // "FREE" | "PAID"
        userType: true,   // "COACH" | "ENTHUSIAST"
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found", success: false },
        { status: 404 }
      );
    }

    const now = new Date();

    // ✅ Step 1: fetch valid announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expireAt: null },
          { expireAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Step 2: strict filtering
    const filteredAnnouncements = announcements.filter((a) => {
      const targets: AudienceType[] =
        a.audiences && a.audiences.length > 0
          ? (a.audiences as AudienceType[])
          : [a.audience as AudienceType];

      const hasEveryone = targets.includes("EVERYONE");

      // 🔥 If EVERYONE + others → ignore EVERYONE
      const effectiveTargets: AudienceType[] =
        hasEveryone && targets.length > 1
          ? targets.filter((t) => t !== "EVERYONE")
          : targets;

      // ✅ ONLY everyone
      if (
        effectiveTargets.length === 1 &&
        effectiveTargets[0] === "EVERYONE"
      ) {
        return true;
      }

      const needsPlan =
        effectiveTargets.includes("FREE") ||
        effectiveTargets.includes("PAID");

      const needsRole =
        effectiveTargets.includes("COACH") ||
        effectiveTargets.includes("ENTHUSIAST");

      const planMatch =
        !needsPlan ||
        (user.membership === "FREE" &&
          effectiveTargets.includes("FREE")) ||
        (user.membership === "PAID" &&
          effectiveTargets.includes("PAID"));

      const roleMatch =
        !needsRole ||
        (user.userType === "COACH" &&
          effectiveTargets.includes("COACH")) ||
        (user.userType === "ENTHUSIAST" &&
          effectiveTargets.includes("ENTHUSIAST"));

      // 🔐 STRICT: must satisfy ALL required conditions
      return planMatch && roleMatch;
    });

    return NextResponse.json(
      {
        success: true,
        announcements: filteredAnnouncements,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      typeof error === "object" &&
      error !== null &&
      "message" in error
        ? (error as { message?: string }).message
        : "Internal Server Error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
};