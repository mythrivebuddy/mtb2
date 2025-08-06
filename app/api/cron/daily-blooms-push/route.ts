import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const forceTest = url.searchParams.get("test") === "true";

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Get notification template
    const template = await prisma.notificationSettings.findUnique({
      where: { notification_type: "DAILY_BLOOM_PUSH_NOTIFICATION" },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Notification template not found" },
        { status: 404 }
      );
    }

    const { title, message } = template;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 2: Get all users with active push subscriptions
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    const eligibleUsersWithCounts: { userId: string; count: number }[] = [];
    console.log("Subscribed users found:", subscribedUsers.length);

    // Step 3: Count completed Daily Blooms
    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        const todos = await prisma.todo.findMany({
          where: {
            userId,
            isCompleted: true,
            ...(forceTest
              ? {}
              : {
                  updatedAt: {
                    gte: yesterday,
                    lt: today,
                  },
                }),
          },
        });

        const count = todos.length;
        if (count > 0) {
          eligibleUsersWithCounts.push({ userId, count });
        }
      })
    );

    console.log("Eligible users with counts:", eligibleUsersWithCounts);

    // Step 4: Send personalized notifications using template
    const results = await Promise.allSettled(
      eligibleUsersWithCounts.map(({ userId, count }) => {
        // Interpolate count in message
        const interpolatedTitle = title.replace("{{count}}", count.toString());
        const interpolatedMessage = message.replace("{{count}}", count.toString());

        return sendPushNotificationToUser(
          userId,
          interpolatedTitle,
          interpolatedMessage,
          { url: "/dashboard/daily-bloom" }
        );
      })
    );

    return NextResponse.json({
      message: "Notifications sent.",
      total: eligibleUsersWithCounts.length,
      success: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Daily Bloom cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
