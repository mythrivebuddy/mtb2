import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const istStart = getISTStartOfDay();
    const istEnd = getISTEndOfDay();

    // 1️⃣ Get program
    const program = await prisma.program.findUnique({
      where: { slug: "2026-complete-makeover" },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ message: "Program not found" });
    }

    // 2️⃣ Users who already got primary reminder today
    const users = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        programId: program.id,
        lastReminderDate: {
          gte: istStart,
          lt: istEnd,
        },
      },
      select: { userId: true },
    });

    if (!users.length) {
      return NextResponse.json({
        status: "ok",
        type: "nudge",
        sent: 0,
      });
    }

    const userIds = users.map((u) => u.userId);

    // 3️⃣ Fetch completions in ONE query (fix N+1)
    const completedToday = await prisma.makeoverProgressLog.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: istStart, lt: istEnd },
      },
      select: { userId: true },
    });

    const completedSet = new Set(completedToday.map((c) => c.userId));

    // 4️⃣ Filter eligible users
    const eligibleUserIds = userIds.filter(
      (userId) => !completedSet.has(userId)
    );

    if (!eligibleUserIds.length) {
      return NextResponse.json({
        status: "ok",
        type: "nudge",
        sent: 0,
      });
    }

    // 5️⃣ ✅ DB-driven bulk notification
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_DAILY_GENTLE_NUDGE,
      userIds: eligibleUserIds,
      context: {}, // optional dynamic fields
    });

    console.log(`[CRON] Gentle nudge sent to ${eligibleUserIds.length} users`);

    return NextResponse.json({
      status: "ok",
      type: "nudge",
      sent: eligibleUserIds.length,
    });
  } catch (error) {
    console.error("🔥 DAILY CMP NUDGE ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}