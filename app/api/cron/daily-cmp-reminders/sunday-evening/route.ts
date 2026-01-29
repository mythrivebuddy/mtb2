// /api/cron/daily-cmp-reminders/sunday-evening with get
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { getISTEndOfWeek, getISTStartOfWeek } from "@/lib/utils/dateUtils";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function GET() {
  const weekStart = getISTStartOfWeek();
  const weekEnd = getISTEndOfWeek();

  const users = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: { userId: true },
  });

  let sent = 0;
  const { title, description, url } = CMP_NOTIFICATIONS.SUNDAY_EVENING_PENDING
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
      title,
      description,
      {
        url,
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

