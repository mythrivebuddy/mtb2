import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { createNotification } from "./notifications";

webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "developer.deepak25@gmail.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || "",
);
function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  );
}

export type PushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  icon = "/logo.png",
  data: Record<string, unknown> = {},
) {
  try {
    const payload = JSON.stringify({
      title,
      body, // ✅ always "body"
      icon,
      url: data.url || "/dashboard/notifications", // pass URL here
      data,
    });

    return await webpush.sendNotification(subscription, payload);
  } catch (error: unknown) {
    console.error("Error sending push notification:", error);

    if (
      error instanceof Error &&
      hasStatusCode(error) &&
      error.statusCode === 410
    ) {
      // Subscription expired or invalid; delete from DB
      throw new Error("Subscription expired");
    }

    throw error;
  }
}

export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  // Fetch all user's push subscriptions saved in DB
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    console.log("No push subscriptions for user", userId);
    return;
  }

  const promises = subscriptions.map(async (sub) => {
    const pushSub: PushSubscription = {
      endpoint: sub.endpoint,
      expirationTime: null,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      return await sendPushNotification(pushSub, title, body, undefined, data);
    } catch (err) {
      console.error("Failed to send push notification to:", sub.endpoint, err);
    }
  });

  return Promise.allSettled(promises);
}

export async function notifyUsersExcept({
  challengeId,
  message,
  title,
  url,
  notTosendUserItself,
}: {
  challengeId: string;
  message: string;
  title: string;
  url: string;
  notTosendUserItself: string;
}) {
  try {
    // 1️⃣ Get all participants except excluded ones
    const participants = await prisma.challengeEnrollment.findMany({
      where: {
        challengeId,
        userId: { not: notTosendUserItself },
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 2️⃣ Send push to each user
    for (const p of participants) {
      await sendPushNotificationToUser(p.userId, title, message, { url });
    }
  } catch (err) {
    console.error("Push notification error (ignored):", err);
  }
}

// optimized function to send push notifications to multiple users

export async function sendPushNotificationMultipleUsers(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  if (!userIds.length) return;

  // 1️⃣ Fetch subscriptions ONCE
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  // 2️⃣ If no subscriptions → exit early
  if (!subscriptions.length) return;

  // 3️⃣ Build payload ONCE
  const payload = JSON.stringify({
    title,
    body,
    icon: "/logo.png",
    url: data.url || "/dashboard",
    data,
  });

  // 4️⃣ Send pushes in parallel
  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          expirationTime: null,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
      ),
    ),
  );
}
export async function sendDbPushNotificationMultipleUsers({
  type,
  userIds,
  context = {},
}: {
  type: NotificationType;
  userIds: string[];
  context?: Record<string, unknown>;
}) {
  try {
    if (!userIds.length) return;

    const setting = await prisma.notificationSettings.findUnique({
      where: { notification_type: type },
    });

    if (!setting) return;

    let title = setting.title;
    let message = setting.message;
    let url = setting.url || "/dashboard";

    // ✅ handle dynamic
    if (setting.isDynamic) {
      const safeContext = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [
          key,
          typeof value === "string" || typeof value === "number"
            ? value
            : String(value ?? ""),
        ])
      );

      Object.entries(safeContext).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        title = title.replace(regex, String(value));
        message = message.replace(regex, String(value));
        url = url.replace(regex, String(value));
      });
    }

    // ✅ create DB notifications (bulk)
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        metadata: { url },
      })),
    });

    // ✅ push (reuse your existing function)
    await sendPushNotificationMultipleUsers(userIds, title, message, { url });

  } catch (error) {
    console.error("❌ Failed to send bulk DB notification:", {
      type,
      userIds,
      context,
      error,
    });
  }
}
export function replaceDynamicNotificationTemplate<
  T extends Record<string, string | number>,
>(template: string, data: T): string {
  return template.replace(/{{(.*?)}}/g, (_, key: string) => {
    const value = data[key.trim() as keyof T];
    return value !== undefined ? String(value) : "";
  });
}

export async function sendPushNotificationFromDBToUser({
  type,
  userId,
  context = {},
}: {
  type: NotificationType;
  userId: string;
  context?: Record<string, unknown>;
}) {
  try {
    const setting = await prisma.notificationSettings.findUnique({
      where: { notification_type: type },
    });

    if (!setting) {
      console.warn(`⚠️ Notification setting not found for type: ${type}`);
      return;
    }

    let title = setting.title;
    let message = setting.message;
    let url = setting.url || "/dashboard";

    // Handle dynamic templates only when needed
    if (setting.isDynamic) {
      const safeContext = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [
          key,
          typeof value === "string" || typeof value === "number"
            ? value
            : String(value ?? ""),
        ]),
      );

      title = replaceDynamicNotificationTemplate(title, safeContext);
      message = replaceDynamicNotificationTemplate(message, safeContext);
      url = replaceDynamicNotificationTemplate(url, safeContext);
    }

    // Create in-app notification (DB)
    await createNotification(userId, type, title, message, { url });

    // Send push notification
    await sendPushNotificationToUser(userId, title, message, { url });
  } catch (error) {
    console.error("❌ Failed to send DB notification:", {
      type,
      userId,
      context,
      error,
    });
  }
}
