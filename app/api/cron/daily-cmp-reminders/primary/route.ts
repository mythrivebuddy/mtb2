// /api/cron/daily-cmp-reminders/primary with get
import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
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
  const notification =
    await getCMPNotification(NotificationType.CMP_DAILY_PRIMARY);
  if (!notification) return NextResponse.json({ message: "no_notification_template" });

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
      notification.title,
      notification.description,
      { url: notification.url }
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


