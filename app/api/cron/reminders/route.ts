// File: app/api/cron/reminders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush, { SendResult, WebPushError } from "web-push"; // Import WebPushError and SendResult

// Configure web-push with your VAPID keys (from your .env file)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:your-email@example.com", // Replace with your email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET() {
  console.log("Cron job for reminders started at:", new Date().toISOString());
  try {
    const now = new Date();
    const activeReminders = await prisma.reminder.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
          },
        },
      },
    });

    // FIX: Changed Promise<any>[] to the specific types returned by the function.
    const notificationsToSend: Promise<SendResult | void>[] = [];
    const remindersToUpdate = new Map<string, Date>();
    const subscriptionsToDelete: string[] = [];

    for (const reminder of activeReminders) {
      const currentTime = now.toTimeString().slice(0, 5);

      if (reminder.startTime && currentTime < reminder.startTime) continue;
      if (reminder.endTime && currentTime > reminder.endTime) continue;

      if (reminder.user.pushSubscriptions.length === 0) continue;

      const lastNotified = reminder.lastNotifiedAt || new Date(0);
      const minutesSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60);

      if (minutesSinceLastNotification >= reminder.frequency) {
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.description,
          icon: reminder.image || "/icon-192x192.png",
          data: { url: `/dashboard/reminders` }
        });

        for (const sub of reminder.user.pushSubscriptions) {
          notificationsToSend.push(
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            ).catch((err: WebPushError) => {
              // If a subscription is gone (404) or expired (410), mark it for deletion.
              if (err.statusCode === 404 || err.statusCode === 410) {
                console.log(`Subscription for user ${reminder.userId} has expired. Marking for deletion.`);
                subscriptionsToDelete.push(sub.id);
              } else {
                console.error(`Failed to send notification for user ${reminder.userId}:`, err.message);
              }
            })
          );
        }
        remindersToUpdate.set(reminder.id, now);
      }
    }

    // Wait for all notifications to be sent
    await Promise.all(notificationsToSend);

    // Update reminders that were successfully notified
    // if (remindersToUpdate.size > 0) {
    //     for (const [id, lastNotifiedAt] of remindersToUpdate.entries()) {
    //         await prisma.reminder.update({
    //             where: { id },
    //             data: { lastNotifiedAt },
    //         });
    //     }
    // }

    // Delete any invalid subscriptions

    console.log(`Cron job finished. Attempted to send ${notificationsToSend.length} notifications.`);
    return NextResponse.json({
      message: "Cron job completed.",
      sentCount: notificationsToSend.length,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

