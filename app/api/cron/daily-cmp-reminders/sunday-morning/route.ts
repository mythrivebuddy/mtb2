// /api/cron/daily-cmp-reminders/sunday-morning with post
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NextResponse } from "next/server";

export async function POST() {
  const users = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: { userId: true },
  });

  let sent = 0;

  for (const { userId } of users) {
    await sendPushNotificationToUser(
      userId,
      "🧭 Sunday Reflection Day",
      "Review your week & set next week’s focus.",
      {
        url: "/dashboard/complete-makeover-program/todays-actions",
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
