// /api/cron/daily-cmp-reminders/primary with post
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { getISTEndOfDay, getISTStartOfDay } from "@/lib/utils/dateUtils";
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
  const {title,description,url} = CMP_NOTIFICATIONS.DAILY_PRIMARY;
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
      title,
      description,
      { url }
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


