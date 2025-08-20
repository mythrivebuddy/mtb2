// File: app/api/cron/reminders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configure web-push with your VAPID keys (from your .env file)
// Make sure these environment variables are set
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
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // 1. Find all active reminders. The time-based check will happen inside the loop.
    const activeReminders = await prisma.reminder.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: {
            pushSubscriptions: true, // Include the user's push subscriptions
          },
        },
      },
    });

    const notificationsToSend = [];
    const remindersToUpdate = new Map<string, Date>();

    for (const reminder of activeReminders) {
      // 2. Check if the reminder is within its active time range (if specified)
      if (reminder.startTime && reminder.endTime) {
        const start = parseInt(reminder.startTime.split(":")[0]) * 60 + parseInt(reminder.startTime.split(":")[1]);
        const end = parseInt(reminder.endTime.split(":")[0]) * 60 + parseInt(reminder.endTime.split(":")[1]);
        if (currentTimeInMinutes < start || currentTimeInMinutes > end) {
          continue; // Skip if outside the active time range
        }
      }
      
      // 3. Check if it's time to send a notification based on frequency
      const lastNotified = reminder.lastNotifiedAt || new Date(0); // If never notified, use a very old date
      const minutesSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60);

      if (minutesSinceLastNotification >= reminder.frequency) {
        // 4. Prepare the notification payload
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.description,
          icon: "/icon-192x192.png", // A default icon for your app
        });

        // 5. Send the notification to all of the user's subscribed devices
        for (const sub of reminder.user.pushSubscriptions) {
          notificationsToSend.push(
            webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            ).catch(err => {
                // If a subscription is invalid, you might want to delete it from your DB
                console.error(`Failed to send notification for user ${reminder.userId}, subscription ${sub.id}:`, err instanceof Error ? err.message : String(err));
            })
          );
        }
        
        // 6. Mark this reminder to be updated with the current time
        remindersToUpdate.set(reminder.id, now);
      }
    }

    // 7. Send all notifications and update the database concurrently
    if (notificationsToSend.length > 0) {
      await Promise.all(notificationsToSend);
      // Update lastNotifiedAt for each reminder individually
      for (const [id, lastNotifiedAt] of remindersToUpdate.entries()) {
          await prisma.reminder.update({
              where: { id },
              data: { lastNotifiedAt },
          });
      }
    }

    console.log(`Cron job finished. Sent ${notificationsToSend.length} notifications.`);
    return NextResponse.json({
      message: "Cron job completed.",
      sentCount: notificationsToSend.length,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
