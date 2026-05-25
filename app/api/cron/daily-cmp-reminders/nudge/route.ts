// app/api/cron/daily-cmp-reminders/nudge/route.ts
//TODO we need to remove this as we are using a combined api for sending primary and nudge cmp reminders (new api /api/cron/daily-cmp-reminders/combined-primary-nudge-sunday)
import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";
import { isAuthorized } from "@/lib/cron/auth";

// ✅ Admin time (8 PM local for EACH USER)
const ADMIN_TIME = { hour: 15, minute: 30 };

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    /* ----------------------------------------------------
       1️⃣ Get program
    ---------------------------------------------------- */
    const program = await prisma.program.findUnique({
      where: { slug: "2026-complete-makeover" },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ message: "Program not found" });
    }

    /* ----------------------------------------------------
       2️⃣ Fetch users with timezone
    ---------------------------------------------------- */
    const states = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        programId: program.id,
      },
      select: {
        userId: true,
        lastReminderDate: true,
        user: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (!states.length) {
      return NextResponse.json({
        status: "ok",
        sent: 0,
      });
    }

    /* ----------------------------------------------------
       3️⃣ Fetch completions (GLOBAL query)
    ---------------------------------------------------- */
    const completions = await prisma.makeoverProgressLog.findMany({
      select: {
        userId: true,
        date: true,
      },
    });

    // Map: userId -> latest completion
    const completionMap = new Map<string, Date>();

    for (const c of completions) {
      completionMap.set(c.userId, c.date);
    }

    /* ----------------------------------------------------
       4️⃣ Process per user (timezone aware)
    ---------------------------------------------------- */
    const eligibleUserIds: string[] = [];

    for (const state of states) {
      const timezone = state.user?.timezone || "UTC";

      const userNow = toZonedTime(now, timezone);

      // ✅ Build 8 PM for that user
      const target = new Date(userNow);
      target.setHours(ADMIN_TIME.hour, ADMIN_TIME.minute, 0, 0);

      const isTimePassed = userNow >= target;

      // ✅ Prevent duplicate same-day notification
      const alreadyNotifiedToday =
        state.lastReminderDate &&
        isSameDay(
          toZonedTime(state.lastReminderDate, timezone),
          userNow
        );

      console.log({
        userId: state.userId,
        userTime: userNow.toLocaleTimeString(),
        targetTime: target.toLocaleTimeString(),
        isTimePassed,
        alreadyNotifiedToday,
      });

      if (!isTimePassed || alreadyNotifiedToday) continue;

      // ✅ Check completion TODAY (user timezone safe)
      const lastCompleted = completionMap.get(state.userId);

      let completedToday = false;

      if (lastCompleted) {
        const userCompletedTime = toZonedTime(lastCompleted, timezone);

        completedToday = isSameDay(userCompletedTime, userNow);
      }

      // ❌ Skip if already completed
      if (completedToday) continue;

      eligibleUserIds.push(state.userId);
    }

    if (!eligibleUserIds.length) {
      return NextResponse.json({
        status: "ok",
        sent: 0,
      });
    }

    /* ----------------------------------------------------
       5️⃣ SEND BULK NOTIFICATION
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_DAILY_GENTLE_NUDGE,
      userIds: eligibleUserIds,
      context: {},
    });

    /* ----------------------------------------------------
       6️⃣ Update lastReminderDate
    ---------------------------------------------------- */
    await prisma.userProgramState.updateMany({
      where: {
        userId: { in: eligibleUserIds },
        programId: program.id,
      },
      data: {
        lastReminderDate: now,
      },
    });

    console.log(`[CRON] Nudge sent to ${eligibleUserIds.length} users`);

    return NextResponse.json({
      status: "ok",
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