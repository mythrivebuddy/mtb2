/**
 * Web Push Utilities
 * This file contains utilities for handling web push notifications
 */
import webpush from "web-push";

// Set VAPID details for web push
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "developer.deepak25@gmail.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

// Type definition for push subscription
export type PushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/**
 * Sends a push notification to a specific subscription
 * @param subscription - The user's push subscription
 * @param title - Notification title
 * @param body - Notification body text
 * @param icon - Icon URL (optional)
 * @param data - Additional data to send with notification
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  icon = "/logo.png",
  data = {}
) {
  try {
    // Create payload for the notification
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon,
        vibrate: [100, 50, 100],
        data: {
          url: "/dashboard/spotlight", // Default URL for spotlight notifications
          ...data,
        },
      },
    });

    // Send the notification using web-push
    return await webpush.sendNotification(subscription, payload);
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    // If subscription is expired or invalid (410 Gone), it should be removed
    if (error.statusCode === 410) {
      throw new Error("Subscription expired");
    }
    throw error;
  }
}
