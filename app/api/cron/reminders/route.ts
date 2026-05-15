// File: app/api/cron/reminders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";

export async function GET() {
  console.log("Cron job for reminders started at:", new Date().toISOString());

  try {
    const now = new Date();

    const activeReminders = await prisma.reminder.findMany({
      where: { isActive: true },
    });

    let sentCount = 0;
    const remindersToUpdate = new Map<string, Date>();

    // 🧠 Grouping map
    const batchMap = new Map<
      string,
      {
        userIds: string[];
        context: Record<string, unknown>;
      }
    >();

    for (const reminder of activeReminders) {
      const currentTime = now.toTimeString().slice(0, 5);

      if (reminder.startTime && currentTime < reminder.startTime) continue;
      if (reminder.endTime && currentTime > reminder.endTime) continue;

      const lastNotified = reminder.lastNotifiedAt || new Date(0);
      const minutesSinceLastNotification =
        (now.getTime() - lastNotified.getTime()) / (1000 * 60);

      if (minutesSinceLastNotification < reminder.frequency) continue;

      // 🔑 Create grouping key (important)
      const key = `${reminder.title}__${reminder.description}`;

      if (!batchMap.has(key)) {
        batchMap.set(key, {
          userIds: [],
          context: {
            title: reminder.title,
            description: reminder.description,
            url: "/dashboard/reminders",
            image: reminder.image,
          },
        });
      }

      batchMap.get(key)!.userIds.push(reminder.userId);

      remindersToUpdate.set(reminder.id, now);
      sentCount++;
    }

    /* ----------------------------------------------------
       ✅ Send batched notifications
    ---------------------------------------------------- */
    for (const { userIds, context } of batchMap.values()) {
      await sendDbPushNotificationMultipleUsers({
        type: NotificationType.REMINDER,
        userIds,
        context,
      });
    }

    /* ----------------------------------------------------
       ✅ Update lastNotifiedAt
    ---------------------------------------------------- */
    if (remindersToUpdate.size > 0) {
      await prisma.$transaction(
        Array.from(remindersToUpdate.entries()).map(([id, lastNotifiedAt]) =>
          prisma.reminder.update({
            where: { id },
            data: { lastNotifiedAt },
          })
        )
      );
    }

    console.log(`Cron job finished. Sent ${sentCount} notifications.`);

    return NextResponse.json({
      message: "Cron job completed.",
      sentCount,
      batches: batchMap.size,
    });
  } catch (error) {
    console.error("Cron job error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}