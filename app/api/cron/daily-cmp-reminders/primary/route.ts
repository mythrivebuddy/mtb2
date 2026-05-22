// app/api/cron/daily-cmp-reminders/primary/route.ts
//TODO we need to remove this as we are using a combined api for sending primary and nudge cmp reminders (new api /api/cron/daily-cmp-reminders/combined-primary-nudge-sunday)
import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";
import { isAuthorized } from "@/lib/cron/auth";

// ✅ Admin time = 8 PM
const ADMIN_TIME = { hour: 20, minute: 0 };

// ✅ Cron window
const WINDOW_MINUTES = 30;

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
       2️⃣ Fetch users
    ---------------------------------------------------- */
    const states = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        programId: program.id,
      },
      select: {
        userId: true,
        lastPrimaryReminderAt: true, // ✅ NEW FIELD
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
        type: "primary",
        sent: 0,
      });
    }

    /* ----------------------------------------------------
       3️⃣ Fetch completions
    ---------------------------------------------------- */
    const completions = await prisma.makeoverProgressLog.findMany({
      select: {
        userId: true,
        date: true,
      },
    });

    const completionMap = new Map<string, Date>();

    for (const c of completions) {
      completionMap.set(c.userId, c.date);
    }

    /* ----------------------------------------------------
       4️⃣ Evaluate users
    ---------------------------------------------------- */
    const eligibleUserIds: string[] = [];

    for (const state of states) {
      const timezone = state.user?.timezone || "UTC";
      const userNow = toZonedTime(now, timezone);

      const currentMinutes = userNow.getHours() * 60 + userNow.getMinutes();

      const adminMinutes = ADMIN_TIME.hour * 60 + ADMIN_TIME.minute;

      // ✅ Window check (8:00 → 8:30)
      const isInWindow =
        currentMinutes >= adminMinutes &&
        currentMinutes < adminMinutes + WINDOW_MINUTES;

      // ✅ Prevent duplicate same-day primary
      const alreadySentPrimaryToday =
        state.lastPrimaryReminderAt &&
        isSameDay(toZonedTime(state.lastPrimaryReminderAt, timezone), userNow);

      if (!isInWindow || alreadySentPrimaryToday) continue;

      // ✅ Completion check
      const lastCompleted = completionMap.get(state.userId);

      let completedToday = false;

      if (lastCompleted) {
        const userCompletedTime = toZonedTime(lastCompleted, timezone);
        completedToday = isSameDay(userCompletedTime, userNow);
      }

      if (completedToday) continue;

      eligibleUserIds.push(state.userId);

      // 🔍 Debug
      console.log({
        userId: state.userId,
        userTime: userNow.toLocaleTimeString(),
        isInWindow,
        alreadySentPrimaryToday,
        completedToday,
      });
    }

    if (!eligibleUserIds.length) {
      return NextResponse.json({
        status: "ok",
        type: "primary",
        sent: 0,
      });
    }

    /* ----------------------------------------------------
       5️⃣ Send notifications
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_DAILY_PRIMARY,
      userIds: eligibleUserIds,
      context: {},
    });

    /* ----------------------------------------------------
       6️⃣ Update field
    ---------------------------------------------------- */
    await prisma.userProgramState.updateMany({
      where: {
        userId: { in: eligibleUserIds },
        programId: program.id,
      },
      data: {
        lastPrimaryReminderAt: now, // ✅ FIXED
      },
    });

    console.log(
      `[CRON] Primary reminder sent to ${eligibleUserIds.length} users`,
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
      { status: 500 },
    );
  }
}
