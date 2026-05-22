// app/api/cron/daily-cmp-reminders/combined-primary-nudge/route.ts

import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { CronKey, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";
import { isAuthorized } from "@/lib/cron/auth";

/* ================= CONFIG ================= */

// Cron window
const WINDOW_MINUTES = 30;

/* ========================================== */

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // ✅ Test flags (keep these)
    const forcePrimary = searchParams.get("forcePrimary") === "true";
    const forceNudge = searchParams.get("forceNudge") === "true";
    const forceSundayMorning =
      searchParams.get("forceSundayMorning") === "true";
    const forceSundayEvening =
      searchParams.get("forceSundayEvening") === "true";
    const testUserId = searchParams.get("userId");

    const now = new Date();
    const cronSchedules = await prisma.cronSchedule.findMany({
      where: {
        key: {
          in: [
            CronKey.CMP_PRIMARY_REMINDER,
            CronKey.CMP_NUDGE_REMINDER,
            CronKey.CMP_SUNDAY_MORNING,
            CronKey.CMP_SUNDAY_EVENING,
          ],
        },
      },
      select: {
        key: true,
        hour: true,
        minute: true,
      },
    });

    const cronMap = new Map(
      cronSchedules.map((c) => [c.key, { hour: c.hour, minute: c.minute }]),
    );
    console.log({ cronSchedules });

    // ✅ Safe fallback defaults (VERY IMPORTANT)
    const PRIMARY_TIME = cronMap.get(CronKey.CMP_PRIMARY_REMINDER) ?? {
      hour: 20,
      minute: 0,
    };

    const NUDGE_TIME = cronMap.get(CronKey.CMP_NUDGE_REMINDER) ?? {
      hour: 22,
      minute: 0,
    };

    const SUNDAY_MORNING = cronMap.get(CronKey.CMP_SUNDAY_MORNING) ?? {
      hour: 10,
      minute: 0,
    };

    const SUNDAY_EVENING = cronMap.get(CronKey.CMP_SUNDAY_EVENING) ?? {
      hour: 20,
      minute: 0,
    };
    /* ---------------- PROGRAM ---------------- */
    const program = await prisma.program.findUnique({
      where: { slug: "2026-complete-makeover" },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ message: "Program not found" });
    }

    /* ---------------- USERS ---------------- */
    const states = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        programId: program.id,
        ...(testUserId && { userId: testUserId }),
      },
      select: {
        userId: true,
        lastPrimaryReminderAt: true,
        lastNudgeReminderAt: true,
        lastSundayMorningReminderAt: true,
        lastSundayEveningReminderAt: true,
        user: { select: { timezone: true } },
      },
    });

    if (!states.length) {
      return NextResponse.json({
        message: "No users",
        primarySent: 0,
        nudgeSent: 0,
        sundayMorningSent: 0,
        sundayEveningSent: 0,
      });
    }

    /* ---------------- COMPLETIONS ---------------- */
    const completions = await prisma.makeoverProgressLog.findMany({
      select: { userId: true, date: true },
    });

    const completionMap = new Map<string, Date>();
    for (const c of completions) {
      completionMap.set(c.userId, c.date);
    }

    /* ---------------- ARRAYS ---------------- */
    const primaryUsers: string[] = [];
    const nudgeUsers: string[] = [];
    const sundayMorningUsers: string[] = [];
    const sundayEveningUsers: string[] = [];

    /* ================= MAIN LOOP ================= */
    for (const state of states) {
      const timezone = state.user?.timezone || "UTC";
      const userNow = toZonedTime(now, timezone);

      const day = userNow.getDay();
      const isRealSunday = day === 0;
      const isForcedSunday = forceSundayMorning || forceSundayEvening;

      const isSunday = isRealSunday || isForcedSunday;

      const currentMinutes = userNow.getHours() * 60 + userNow.getMinutes();

      /* ---------- COMPLETION CHECK ---------- */
      const lastCompleted = completionMap.get(state.userId);

      let completedToday = false;

      if (lastCompleted) {
        const userCompletedTime = toZonedTime(lastCompleted, timezone);
        completedToday = isSameDay(userCompletedTime, userNow);
      }

      if (completedToday) continue;

      /* ================= SUNDAY ================= */
      if (isSunday) {
        const morningMin = SUNDAY_MORNING.hour * 60 + SUNDAY_MORNING.minute;

        const eveningMin = SUNDAY_EVENING.hour * 60 + SUNDAY_EVENING.minute;

        const isMorningWindow =
          currentMinutes >= morningMin &&
          currentMinutes < morningMin + WINDOW_MINUTES;

        const isEveningWindow =
          currentMinutes >= eveningMin &&
          currentMinutes < eveningMin + WINDOW_MINUTES;

        const alreadyMorning =
          state.lastSundayMorningReminderAt &&
          isSameDay(
            toZonedTime(state.lastSundayMorningReminderAt, timezone),
            userNow,
          );

        const alreadyEvening =
          state.lastSundayEveningReminderAt &&
          isSameDay(
            toZonedTime(state.lastSundayEveningReminderAt, timezone),
            userNow,
          );

        if ((isMorningWindow || forceSundayMorning) && !alreadyMorning) {
          sundayMorningUsers.push(state.userId);
          continue;
        }

        if ((isEveningWindow || forceSundayEvening) && !alreadyEvening) {
          sundayEveningUsers.push(state.userId);
          continue;
        }

        continue; // 🚨 block weekday logic
      }

      /* ================= WEEKDAYS ================= */

      const primaryMin = PRIMARY_TIME.hour * 60 + PRIMARY_TIME.minute;

      const nudgeMin = NUDGE_TIME.hour * 60 + NUDGE_TIME.minute;

      const isPrimaryWindow =
        currentMinutes >= primaryMin &&
        currentMinutes < primaryMin + WINDOW_MINUTES;

      const isNudgeWindow =
        currentMinutes >= nudgeMin &&
        currentMinutes < nudgeMin + WINDOW_MINUTES;

      const alreadyPrimary =
        state.lastPrimaryReminderAt &&
        isSameDay(toZonedTime(state.lastPrimaryReminderAt, timezone), userNow);

      const alreadyNudge =
        state.lastNudgeReminderAt &&
        isSameDay(toZonedTime(state.lastNudgeReminderAt, timezone), userNow);

      if ((isPrimaryWindow || forcePrimary) && !alreadyPrimary) {
        primaryUsers.push(state.userId);
        continue;
      }

      if (
        (isNudgeWindow || forceNudge) &&
        !alreadyNudge &&
        (alreadyPrimary || forceNudge)
      ) {
        nudgeUsers.push(state.userId);
      }
    }

    /* ================= SEND ================= */

    if (primaryUsers.length) {
      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_DAILY_PRIMARY,
        userIds: primaryUsers,
      });

      await prisma.userProgramState.updateMany({
        where: { userId: { in: primaryUsers }, programId: program.id },
        data: { lastPrimaryReminderAt: now },
      });
    }

    if (nudgeUsers.length) {
      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_DAILY_GENTLE_NUDGE,
        userIds: nudgeUsers,
      });

      await prisma.userProgramState.updateMany({
        where: { userId: { in: nudgeUsers }, programId: program.id },
        data: { lastNudgeReminderAt: now },
      });
    }

    if (sundayMorningUsers.length) {
      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_SUNDAY_MORNING,
        userIds: sundayMorningUsers,
      });

      await prisma.userProgramState.updateMany({
        where: { userId: { in: sundayMorningUsers }, programId: program.id },
        data: { lastSundayMorningReminderAt: now },
      });
    }

    if (sundayEveningUsers.length) {
      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_SUNDAY_EVENING_PENDING,
        userIds: sundayEveningUsers,
      });

      await prisma.userProgramState.updateMany({
        where: { userId: { in: sundayEveningUsers }, programId: program.id },
        data: { lastSundayEveningReminderAt: now },
      });
    }

    return NextResponse.json({
      message: "Combined reminders processed",
      primarySent: primaryUsers.length,
      nudgeSent: nudgeUsers.length,
      sundayMorningSent: sundayMorningUsers.length,
      sundayEveningSent: sundayEveningUsers.length,
    });
  } catch (error) {
    console.error("🔥 COMBINED CRON ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
