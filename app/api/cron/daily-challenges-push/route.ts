import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";
import { ChallengeJoinMode } from "@prisma/client";

export async function GET() {
  try {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    // 1️⃣ Get subscribed users
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    if (subscribedUsers.length === 0) {
      return NextResponse.json({
        message: "No subscribed users found.",
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    const userIds = subscribedUsers.map((u) => u.userId);

    // 2️⃣ Fetch all active enrollments (single query)
    const enrollments = await prisma.challengeEnrollment.findMany({
      where: {
        userId: { in: userIds },
        status: "IN_PROGRESS",
        challenge: {
          status: "ACTIVE",
          joinMode: ChallengeJoinMode.MANUAL,
        },
      },
      select: {
        userId: true,
        challengeId: true,
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        message: "No active challenges found.",
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    // 3️⃣ Fetch all completions for today (single query)
    const completions = await prisma.completionRecord.findMany({
      where: {
        userId: { in: userIds },
        status: "COMPLETED",
        date: todayUtc,
      },
      select: {
        userId: true,
        challengeId: true,
      },
    });

    // 4️⃣ Build maps (O(n))
    const enrollmentMap = new Map<string, Set<string>>();
    const completionMap = new Map<string, Set<string>>();

    for (const e of enrollments) {
      if (!enrollmentMap.has(e.userId)) {
        enrollmentMap.set(e.userId, new Set());
      }
      enrollmentMap.get(e.userId)!.add(e.challengeId);
    }

    for (const c of completions) {
      if (!completionMap.has(c.userId)) {
        completionMap.set(c.userId, new Set());
      }
      completionMap.get(c.userId)!.add(c.challengeId);
    }

    // 5️⃣ Compute eligible users
    const eligibleUsers: {
      userId: string;
      inProgressCount: number;
    }[] = [];

    for (const [userId, challenges] of enrollmentMap.entries()) {
      const completed = completionMap.get(userId) || new Set();

      const inProgressCount = [...challenges].filter(
        (id) => !completed.has(id)
      ).length;

      if (inProgressCount > 0) {
        eligibleUsers.push({ userId, inProgressCount });
      }
    }

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: "No eligible users to notify.",
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    // 6️⃣ Send notifications (DB-driven)
    const results = await Promise.allSettled(
      eligibleUsers.map(({ userId, inProgressCount }) =>
        sendPushNotificationFromDBToUser({
          type: "DAILY_CHALLENGE_PUSH_NOTIFICATION",
          userId,
          context: {
            count: inProgressCount,
          },
        }),
      )
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: "Daily challenge notifications sent.",
      total: eligibleUsers.length,
      success,
      failed,
    });
  } catch (error) {
    console.error("🔥 Daily Challenge Push Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}