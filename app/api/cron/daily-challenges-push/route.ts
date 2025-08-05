import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    const eligibleUsers: {
      userId: string;
      completedCount: number;
      inProgressCount: number;
    }[] = [];

    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        const completed = await prisma.challengeEnrollment.count({
          where: {
            userId,
            status: "COMPLETED",
          },
        });

        const inProgress = await prisma.challengeEnrollment.count({
          where: {
            userId,
            status: "IN_PROGRESS",
          },
        });

        if (completed > 0 || inProgress > 0) {
          eligibleUsers.push({
            userId,
            completedCount: completed,
            inProgressCount: inProgress,
          });
        }
      })
    );

    const results = await Promise.allSettled(
      eligibleUsers.map(({ userId, completedCount, inProgressCount }) => {
        const parts: string[] = [];

        if (completedCount > 0)
          parts.push(`✅ ${completedCount} completed challenge${completedCount > 1 ? "s" : ""}`);

        if (inProgressCount > 0)
          parts.push(`📌 ${inProgressCount} in progress`);

        const challengeLabel =
          completedCount + inProgressCount > 1 ? "challenges" : "challenge";

        const body =
          parts.length > 0
            ? `You're making great progress! 💪 ${parts.join(" and ")} in your daily ${challengeLabel}. Keep it up! 🌟`
            : "Don't forget to keep up your streak! Start a challenge today and stay on track. 🚀";

        return sendPushNotificationToUser(
          userId,
          "🌿 Your Daily Challenge Update",
          body,
          { url: "/dashboard/daily-challenge-push" }
        );
      })
    );

    return NextResponse.json({
      message: "Daily challenge notifications sent.",
      total: eligibleUsers.length,
      success: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Daily Challenge Push Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
