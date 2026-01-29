// /api/cron/daily-cmp-reminders/nudge with post
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NextResponse } from "next/server";

export async function POST() {
  const istStart = getISTStartOfDay();
  const istEnd = getISTEndOfDay();

  const users = await prisma.userProgramState.findMany({
    where: {
      onboarded: true,
      lastReminderDate: {
        gte: istStart, // primary already sent today
        lt: istEnd,
      },
    },
    select: { userId: true },
  });

  let sentCount = 0;

  for (const { userId } of users) {
    // Skip if user completed after primary
    const completed = await prisma.makeoverProgressLog.findFirst({
      where: {
        userId,
        date: { gte: istStart, lt: istEnd },
      },
      select: { id: true },
    });

    if (completed) continue;

    await sendPushNotificationToUser(
      userId,
      "⏳ Still time for today’s CMP progress",
      "One small action is enough.",
      { url: "/dashboard/complete-makeover-program/todays-actions" }
    );

    sentCount++;
  }

  console.log(`[CRON] Gentle nudge sent to ${sentCount} users`);

  return NextResponse.json({
    status: "ok",
    type: "nudge",
    sent: sentCount,
  });
}

/* ---------------- HELPERS ---------------- */

function getISTStartOfDay(): Date {
  const d = getNowInIST();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getISTEndOfDay(): Date {
  const d = getNowInIST();
  d.setHours(24, 0, 0, 0);
  return d;
}

function getNowInIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}
