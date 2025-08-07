import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function GET() {
  try {
    // 1. Fetch the notification template by type
    const template = await prisma.notificationSettings.findUnique({
      where: { notification_type: "DAILY_CHALLENGE_PUSH_NOTIFICATION" },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Notification template not found" },
        { status: 404 }
      );
    }

    const { title, message } = template;

    // 2. Fetch subscribed users
    const subscribedUsers = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    const eligibleUsers: {
      userId: string;
      // completedCount: number;
      inProgressCount: number;
    }[] = [];

    // 3. Determine eligible users
    await Promise.all(
      subscribedUsers.map(async ({ userId }) => {
        // const completed = await prisma.challengeEnrollment.count({
        //   where: { userId, status: "COMPLETED" },
        // });

        const inProgress = await prisma.challengeEnrollment.count({
          where: { userId, status: "IN_PROGRESS" },
        });

        if (
          // completed > 0 ||
           inProgress > 0) {
          eligibleUsers.push({
            userId,
            // completedCount: completed,
            inProgressCount: inProgress,      
          });
        }
      })
    );

    // 4. Send notifications using fetched template
    const results = await Promise.allSettled(
      eligibleUsers.map(
        async ({ userId }) =>
          await sendPushNotificationToUser(userId, title, message, {
            url: "/dashboard/challenge/upcoming-challenges",
          })
      )
    );
    console.log("success ", results);

    return NextResponse.json({
      message: "Daily challenge notifications sent.",
      total: eligibleUsers.length,
      success: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Daily Challenge Push Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
