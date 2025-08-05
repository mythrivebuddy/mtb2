import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  // const url = new URL(req.url);
  // const forceTest = url.searchParams.get("test") === "true";

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
        const parts = [];

        if (completedCount > 0)
          parts.push(`✅ ${completedCount} completed challenges`);

        if (inProgressCount > 0)
          parts.push(`📌 ${inProgressCount} challenges in progress`);

        const body =
          parts.length > 0
            ? `You have: ${parts.join(", ")}  in Daily Challenge${completedCount + inProgressCount > 1 ? "s" : ""}`
            : "Keep going on your Daily Challenges!";

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
