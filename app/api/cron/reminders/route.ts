// File: app/api/cron/reminders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush, { SendResult } from "web-push";

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
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Find all active reminders that might be due
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

    const notificationsToSend: Promise<SendResult | void>[] = [];
    const remindersToUpdate = new Map<string, Date>();

    for (const reminder of activeReminders) {
      // Skip if the user has no active push subscriptions
      if (reminder.user.pushSubscriptions.length === 0) {
        continue;
      }

      // Check if the reminder is within its active time range (if specified)
      if (reminder.startTime && reminder.endTime) {
        const start = parseInt(reminder.startTime.split(":")[0]) * 60 + parseInt(reminder.startTime.split(":")[1]);
        const end = parseInt(reminder.endTime.split(":")[0]) * 60 + parseInt(reminder.endTime.split(":")[1]);
        if (currentTimeInMinutes < start || currentTimeInMinutes > end) {
          continue;
        }
      }
      
      const lastNotified = reminder.lastNotifiedAt || new Date(0);
      const minutesSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60);

      if (minutesSinceLastNotification >= reminder.frequency) {
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.description,
          icon: reminder.image || "/icon-192x192.png",
          data: {
            url: `/dashboard/reminders` // Link back to the reminders page
          }
        });

        for (const sub of reminder.user.pushSubscriptions) {
          notificationsToSend.push(
            webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            ).catch(err => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`Failed to send notification for user ${reminder.userId}, subscription ${sub.id}:`, errorMessage);
            })
          );
        }
        
        remindersToUpdate.set(reminder.id, now);
      }
    }

    if (notificationsToSend.length > 0) {
      await Promise.all(notificationsToSend);
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
