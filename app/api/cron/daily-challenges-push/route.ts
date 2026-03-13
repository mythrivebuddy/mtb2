import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { ChallengeJoinMode } from "@prisma/client";

export async function GET() {
  try {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    // 1️⃣ Notification template
    const template = await prisma.notificationSettings.findUnique({
      where: { notification_type: "DAILY_CHALLENGE_PUSH_NOTIFICATION" },
    });

    const title = template?.title ?? "Daily Challenge Reminder";
    const message =
      template?.message ?? "Don't forget to check your daily challenges!";

    // 2️⃣ Subscribed users
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    const eligibleUsers: {
      userId: string;
      inProgressCount: number;
    }[] = [];

    // 3️⃣ Eligibility logic
    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        // Active challenges
        const activeEnrollments = await prisma.challengeEnrollment.findMany({
          where: {
            userId,
            status: "IN_PROGRESS",
            challenge: {
              status: "ACTIVE",
              joinMode: ChallengeJoinMode.MANUAL,
            },
          },
          select: { challengeId: true },
        });

        if (activeEnrollments.length === 0) {
          return;
        }

        const activeChallengeIds = activeEnrollments.map((e) => e.challengeId);

        // Completed challenges today
        const completedToday = await prisma.completionRecord.findMany({
          where: {
            userId,
            challengeId: { in: activeChallengeIds },
            status: "COMPLETED",
            date: todayUtc,
          },
          select: { challengeId: true, date: true },
        });

        // Decision
        if (completedToday.length === activeChallengeIds.length) {
          return;
        }

        const inProgressCount =
          activeChallengeIds.length - completedToday.length;

        eligibleUsers.push({
          userId,
          inProgressCount,
        });
      }),
    );

    // 4️⃣ Send notifications
    const results = await Promise.allSettled(
      eligibleUsers.map(({ userId }) =>
        sendPushNotificationToUser(userId, title, message, {
          url: "/dashboard/challenge",
        }),
      ),
    );

    return NextResponse.json({
      message: "Daily challenge notifications sent.",
      total: eligibleUsers.length,
      eligibleUsers,
      success: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("🔥 Daily Challenge Push Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
