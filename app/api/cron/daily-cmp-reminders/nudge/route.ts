// /api/cron/daily-cmp-reminders/nudge with post
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
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
  const {title,description,url} = CMP_NOTIFICATIONS.DAILY_GENTLE_NUDGE
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
      title,
      description,
      { url }
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


