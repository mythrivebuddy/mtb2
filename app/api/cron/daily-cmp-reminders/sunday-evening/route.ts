// /api/cron/daily-cmp-reminders/sunday-evening with post
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function POST() {
  const weekStart = getISTStartOfWeek();
  const weekEnd = getISTEndOfWeek();

  const users = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: { userId: true },
  });

  let sent = 0;

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
      "📝 Don’t miss your weekly reflection",
      "This unlocks your full weekly points.",
      {
        url: "/dashboard/complete-makeover-program/todays-actions",
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

/* ---------------- HELPERS ---------------- */

function getISTStartOfWeek(): Date {
  const d = getNowInIST();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getISTEndOfWeek(): Date {
  const d = getISTStartOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}

function getNowInIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}
