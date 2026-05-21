import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const istStart = getISTStartOfDay();
    const istEnd = getISTEndOfDay();
    const program = await prisma.program.findUnique({
      where: { slug: "2026-complete-makeover" },
      select: { id: true },
    })
    // 1️⃣ Fetch eligible users (not reminded today)
    const users = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        programId:program?.id,
        OR: [
          { lastReminderDate: null },
          { lastReminderDate: { lt: istStart } },
        ],
      },
      select: { userId: true },
    });

    if (!users.length) {
      return NextResponse.json({
        status: "ok",
        type: "primary",
        sent: 0,
      });
    }

    const userIds = users.map((u) => u.userId);

    // 2️⃣ Fetch today's completions (single query)
    const completedToday = await prisma.makeoverProgressLog.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: istStart, lt: istEnd },
      },
      select: { userId: true },
    });

    const completedSet = new Set(completedToday.map((c) => c.userId));

    // 3️⃣ Filter users who still need reminder
    const eligibleUserIds = userIds.filter(
      (userId) => !completedSet.has(userId)
    );

    if (!eligibleUserIds.length) {
      return NextResponse.json({
        status: "ok",
        type: "primary",
        sent: 0,
      });
    }

    // 4️⃣ ✅ Send DB-driven bulk notification
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_DAILY_PRIMARY,
      userIds: eligibleUserIds,
      context: {}, // add dynamic later if needed
    });

    // 5️⃣ ✅ Bulk update reminder timestamp
    await prisma.userProgramState.updateMany({
      where: {
        userId: { in: eligibleUserIds },
        programId:program?.id,
      },
      data: {
        lastReminderDate: new Date(),
      },
    });

    console.log(
      `[CRON] Primary reminder sent to ${eligibleUserIds.length} users`
    );

    return NextResponse.json({
      status: "ok",
      type: "primary",
      sent: eligibleUserIds.length,
    });
  } catch (error) {
    console.error("🔥 PRIMARY REMINDER ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}