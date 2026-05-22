// app/api/cron/daily-cmp-reminders/inactivity/three-or-seven-days/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CronKey, NotificationType } from "@prisma/client";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { toZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";
import { isAuthorized } from "@/lib/cron/auth";


export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const cronSchedules = await prisma.cronSchedule.findMany({
  where: {
    key: {
      in: [
        CronKey.CMP_INACTIVITY_3_DAY,
        CronKey.CMP_INACTIVITY_7_DAY,
      ],
    },
  },
  select: {
    key: true,
    hour: true,
    minute: true,
  },
});
  console.log({cronSchedules});
  
const cronMap = new Map(
  cronSchedules.map((c) => [c.key, { hour: c.hour, minute: c.minute }])
);

// ✅ Separate times
const TIME_3_DAY = cronMap.get(CronKey.CMP_INACTIVITY_3_DAY) ?? {
  hour: 22,
  minute: 0,
};

const TIME_7_DAY = cronMap.get(CronKey.CMP_INACTIVITY_7_DAY) ?? {
  hour: 22,
  minute: 0,
};
    /* ----------------------------------------------------
       1️⃣ Fetch program states
    ---------------------------------------------------- */
    const states = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
        program: {
          slug: "2026-complete-makeover", 
        },
      },
      select: {
        userId: true,
        programId: true,
        inactivity3DayNotified: true,
        inactivity7DayNotified: true,
        user: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (!states.length) {
      return NextResponse.json({
        message: "No users",
        processed: 0,
      });
    }

    /* ----------------------------------------------------
       2️⃣ Fetch last activity
    ---------------------------------------------------- */
    const lastActivities = await prisma.makeoverPointsSummary.findMany({
      select: {
        userId: true,
        programId: true,
        lastUpdated: true,
      },
      distinct: ["userId", "programId"],
    });

    const lastActivityMap = new Map(
      lastActivities.map((a) => [`${a.userId}_${a.programId}`, a.lastUpdated]),
    );

    /* ----------------------------------------------------
       3️⃣ Prepare
    ---------------------------------------------------- */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notify3Day: { userId: string; programId: string }[] = [];
    const notify7Day: { userId: string; programId: string }[] = [];

    /* ----------------------------------------------------
       4️⃣ MAIN LOOP (SINGLE PASS)
    ---------------------------------------------------- */
    for (const state of states) {
      const timezone = state.user?.timezone || "UTC";
      const userNow = toZonedTime(now, timezone);

      // ✅ Admin time check
  // 3 DAY TIME
const target3 = new Date(userNow);
target3.setHours(TIME_3_DAY.hour, TIME_3_DAY.minute, 0, 0);

const is3DayTimePassed = userNow >= target3;

// 7 DAY TIME
const target7 = new Date(userNow);
target7.setHours(TIME_7_DAY.hour, TIME_7_DAY.minute, 0, 0);

const is7DayTimePassed = userNow >= target7;

      const key = `${state.userId}_${state.programId}`;
      const lastActiveAt = lastActivityMap.get(key);

      if (!lastActiveAt) continue;

      const refDate = new Date(lastActiveAt);
      refDate.setHours(0, 0, 0, 0);

      const diffDays =
        (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);

      // ✅ Prevent duplicate same-day notifications
      const alreadyNotifiedToday =
        (state.inactivity3DayNotified &&
          isSameDay(
            toZonedTime(state.inactivity3DayNotified, timezone),
            userNow,
          )) ||
        (state.inactivity7DayNotified &&
          isSameDay(
            toZonedTime(state.inactivity7DayNotified, timezone),
            userNow,
          ));

      if (alreadyNotifiedToday) continue;

      // 🔥 PRIORITY: 7 DAY FIRST
      if (  diffDays >= 7 &&
  !state.inactivity7DayNotified &&
  is7DayTimePassed) {
        notify7Day.push({
          userId: state.userId,
          programId: state.programId,
        });
        continue;
      }

      // 🔥 THEN 3 DAY
      if (  diffDays >= 3 &&
  !state.inactivity3DayNotified &&
  is3DayTimePassed) {
        notify3Day.push({
          userId: state.userId,
          programId: state.programId,
        });
      }
    }

    /* ----------------------------------------------------
       5️⃣ SEND NOTIFICATIONS
    ---------------------------------------------------- */

    let sent3Day = 0;
    let sent7Day = 0;

    if (notify3Day.length) {
      const userIds = [...new Set(notify3Day.map((u) => u.userId))];

      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_INACTIVITY_3_DAYS,
        userIds,
        context: { count: notify3Day.length },
      });

      await prisma.userProgramState.updateMany({
        where: {
          OR: notify3Day.map((u) => ({
            userId: u.userId,
            programId: u.programId,
          })),
        },
        data: {
          inactivity3DayNotified: today,
          lastReminderDate: today,
        },
      });

      sent3Day = userIds.length;
    }

    if (notify7Day.length) {
      const userIds = [...new Set(notify7Day.map((u) => u.userId))];

      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.CMP_INACTIVITY_7_DAYS,
        userIds,
        context: { count: notify7Day.length },
      });

      await prisma.userProgramState.updateMany({
        where: {
          OR: notify7Day.map((u) => ({
            userId: u.userId,
            programId: u.programId,
          })),
        },
        data: {
          inactivity7DayNotified: today,
          lastReminderDate: today,
        },
      });

      sent7Day = userIds.length;
    }

    return NextResponse.json({
      message: "Inactivity notifications processed",
      processedStates: states.length,
      notify3DayCount: notify3Day.length,
      notify7DayCount: notify7Day.length,
      sent3Day,
      sent7Day,
    });
  } catch (error) {
    console.error("🔥 INACTIVITY CRON ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
