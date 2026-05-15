import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendPushNotificationFromDBToUser,
} from "@/lib/utils/pushNotifications";

export async function GET() {
  try {

    // Define time window
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 2: Get users with active push subscriptions
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

    // Step 3: Check if users have completed todos
    const eligibleUsersWithCounts: { userId: string; count: number }[] = [];

    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        const todos = await prisma.todo.findMany({
          where: {
            userId,
            isCompleted: false,
          },
        });

        const count = todos.length;

        if (count > 0) {
          eligibleUsersWithCounts.push({ userId, count });
        }
      }),
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
      eligibleUsersWithCounts.map(({ userId, count }) => {
        return sendPushNotificationFromDBToUser({
          type: "DAILY_BLOOM_PUSH_NOTIFICATION",
          userId,
          context: {
            count,
          },
        });
      }),
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
      { status: 500 },
    );
  }
}
