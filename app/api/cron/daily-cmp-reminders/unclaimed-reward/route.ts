import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";

export async function GET() {
  try {
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - FORTY_EIGHT_HOURS);

    /* ----------------------------------------------------
       1️⃣ Fetch eligible rewards
    ---------------------------------------------------- */
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
      },
    });

    if (!rewards.length) {
      return NextResponse.json({ sent: 0 });
    }

    /* ----------------------------------------------------
       2️⃣ Group users (avoid duplicate pushes)
    ---------------------------------------------------- */
    const userIds = [...new Set(rewards.map((r) => r.userId))];

    /* ----------------------------------------------------
       3️⃣ ✅ Send DB-driven bulk notification
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_REWARD_UNCLAIMED,
      userIds,
      context: {}, // optional dynamic later
    });

    /* ----------------------------------------------------
       4️⃣ Mark rewards as reminded (bulk-safe)
    ---------------------------------------------------- */
    await prisma.userMakeoverSelfReward.updateMany({
      where: {
        id: { in: rewards.map((r) => r.id) },
      },
      data: {
        unclaimedReminderSentAt: new Date(),
      },
    });

    return NextResponse.json({
      sent: rewards.length,
      usersNotified: userIds.length,
    });
  } catch (error) {
    console.error("🔥 REWARD REMINDER ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}