import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { CMP_NOTIFICATIONS } from "@/lib/constant";


export async function GET() {

  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - FORTY_EIGHT_HOURS);

  // 1️⃣ find unclaimed + unlocked ≥ 48h + not reminded
  const rewards = await prisma.userMakeoverSelfReward.findMany({
    where: {
      completedAt: null,
      unclaimedReminderSentAt: null,
      unlockedAt: {
        lte: cutoff,
      },
    },
    select: {
      id: true,
      userId: true,
      programId: true,
    },
  });

  if (rewards.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { title, description, url } =
    CMP_NOTIFICATIONS.REWARD_UNCLAIMED;

  // 2️⃣ send reminders + mark as sent
  for (const reward of rewards) {
    // fire & forget notification
    void sendPushNotificationToUser(
      reward.userId,
      title, // 🎁 Your reward is still waiting
      description, // Take a moment to celebrate.
      {
        url: url,
      }
    );

    // guard update (prevents repeat reminders)
    await prisma.userMakeoverSelfReward.update({
      where: { id: reward.id },
      data: {
        unclaimedReminderSentAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    sent: rewards.length,
  });
}
