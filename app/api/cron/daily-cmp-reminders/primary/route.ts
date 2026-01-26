// /api/cron/daily-cmp-reminders/primary with post
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NextResponse } from "next/server";

export async function POST() {
  const istStart = getISTStartOfDay();
  const istEnd = getISTEndOfDay();

  // Fetch onboarded users
  const users = await prisma.userProgramState.findMany({
    where: {
      onboarded: true,
      OR: [
        { lastReminderDate: null },
        { lastReminderDate: { lt: istStart } },
      ],
    },
    select: { userId: true },
  });

  let sentCount = 0;

  for (const { userId } of users) {
    // Skip if user already completed today
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
      "🔔 Today’s CMP Card is waiting",
      "Complete your Identity, Action & Win for today.",
      { url: "/dashboard/complete-makeover-program/todays-actions" }
    );

    // Mark reminder sent for today
    await prisma.userProgramState.updateMany({
      where: { userId },
      data: { lastReminderDate: new Date() },
    });

    sentCount++;
  }

  console.log(`[CRON] Primary reminder sent to ${sentCount} users`);

  return NextResponse.json({
    status: "ok",
    type: "primary",
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
