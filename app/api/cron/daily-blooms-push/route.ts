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

    // Define time window
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(
      forceTest
        ? "Running in TEST mode (no time filter)"
        : `Time filter: updatedAt >= ${yesterday.toISOString()} AND < ${today.toISOString()}`
    );

    // Step 2: Get users with active push subscriptions
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    console.log("Subscribed users found:", subscribedUsers.length);

    if (subscribedUsers.length === 0) {
      return NextResponse.json({
        message: "No subscribed users found.",
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    // Step 3: Check if users have completed todos
    const eligibleUsersWithCounts: { userId: string; count: number }[] = [];

    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        const todos = await prisma.todo.findMany({
          where: {
            userId,
            isCompleted: false,
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
        console.log(`User ${userId} completed ${count} todos`);

        if (count > 0) {
          eligibleUsersWithCounts.push({ userId, count });
        }
      })
    );

    console.log("Eligible users with counts:", eligibleUsersWithCounts.length);

    if (eligibleUsersWithCounts.length === 0) {
      return NextResponse.json({
        message: "No eligible users to notify.",
        total: 0,
        success: 0,
        failed: 0,
      });
    }

    // Step 4: Send notifications
    const results = await Promise.allSettled(
      eligibleUsersWithCounts.map(({ userId }) => {
        // Optional: interpolate {{count}} in message if needed
        // const interpolatedTitle = title.replace("{{count}}", count.toString());
        // const interpolatedMessage = message.replace("{{count}}", count.toString());

        return sendPushNotificationToUser(
          userId,
          title,
          message,
          { url: "/dashboard/daily-bloom" }
        );
      })
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log("Notification results:", { success, failed });

    return NextResponse.json({
      message: "Notifications sent.",
      total: eligibleUsersWithCounts.length,
      success,
      failed,
    });
  } catch (error) {
    console.error("Daily Bloom cron error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
