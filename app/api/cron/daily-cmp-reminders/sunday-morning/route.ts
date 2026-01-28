// /api/cron/daily-cmp-reminders/sunday-morning with post
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NextResponse } from "next/server";

export async function POST() {
  const users = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: { userId: true },
  });

  let sent = 0;

  const {title,description,url} = CMP_NOTIFICATIONS.SUNDAY_MORNING
  for (const { userId } of users) {
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

  console.log(`[SUNDAY] Morning reminder sent to ${sent} users`);

  return NextResponse.json({
    status: "ok",
    type: "sunday-morning",
    sent,
  });
}
