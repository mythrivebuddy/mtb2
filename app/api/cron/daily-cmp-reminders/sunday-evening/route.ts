// /api/cron/daily-cmp-reminders/sunday-evening with get
import { prisma } from "@/lib/prisma";
import { getISTEndOfWeek, getISTStartOfWeek } from "@/lib/utils/dateUtils";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";

export async function GET() {
  const weekStart = getISTStartOfWeek();
  const weekEnd = getISTEndOfWeek();

  const users = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: { userId: true },
  });

  let sent = 0;

  const notification = await getCMPNotification(
    NotificationType.CMP_SUNDAY_EVENING_PENDING
  );
  if (!notification) return Response.json({ message: "no_notification_template for sunday evening pending" });
  for (const { userId } of users) {
    const completed = await prisma.sundayProgressLog.findFirst({
      where: {
        userId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
        card1WeeklyWin: true,
        card2Done: true,
        // card3Done: true, since card 3 is optional for now 
      },
      select: { id: true },
    });

    if (completed) continue;

    await sendPushNotificationToUser(
      userId,
      notification.title,
      notification.description,
      {
        url: notification.url,
      }
    );

    sent++;
  }

  console.log(`[SUNDAY] Evening reminder sent to ${sent} users`);

  return Response.json({
    status: "ok",
    type: "sunday-evening",
    sent,
  });
}

