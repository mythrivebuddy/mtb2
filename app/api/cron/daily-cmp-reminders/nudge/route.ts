// /api/cron/daily-cmp-reminders/nudge with get
import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
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


  const notification = await getCMPNotification(NotificationType.CMP_DAILY_GENTLE_NUDGE);
  if (!notification) return NextResponse.json({ message: "no_notification_template for the gentle nudge" });
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
      notification.title,
      notification.description,
      { url: notification.url }
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


