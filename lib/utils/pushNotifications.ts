// /**
//  * Push Notification Utilities
//  * Separate from in-app notifications, handles browser push notifications only
//  */
// import webpush from "web-push";
// import { prisma } from "@/lib/prisma";

// // Set VAPID details for web push
// webpush.setVapidDetails(
//   `mailto:${process.env.ADMIN_EMAIL || "developer.deepak25@gmail.com"}`,
//   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
//   process.env.VAPID_PRIVATE_KEY || ""
// );

// // Type definition for push subscription
// export type PushSubscription = {
//   endpoint: string;
//   expirationTime: number | null;
//   keys: {
//     p256dh: string;
//     auth: string;
//   };
// };

// /**
//  * Sends a push notification to a specific subscription
//  * @param subscription - The user's push subscription
//  * @param title - Notification title
//  * @param body - Notification body text
//  * @param icon - Icon URL (optional)
//  * @param data - Additional data to send with notification
//  */
// export async function sendPushNotification(
//   subscription: PushSubscription,
//   title: string,
//   body: string,
//   icon = "/logo.png",
//   data = {}
// ) {
//   try {
//     // Create payload for the notification
//     const payload = JSON.stringify({
//       notification: {
//         title,
//         body,
//         icon,
//         vibrate: [100, 50, 100],
//         data: {
//           url: "/dashboard", // Default URL
//           ...data,
//         },
//       },
//     });

//     // Send the notification using web-push
//     return await webpush.sendNotification(subscription, payload);
//   } catch (error) {
//     console.error("Error sending push notification:", error);
//     // If subscription is expired or invalid (410 Gone), it should be removed
//     if (
//       error instanceof Error &&
//       "statusCode" in error &&
//       error.statusCode === 410
//     ) {
//       throw new Error("Subscription expired");
//     }
//     throw error;
//   }
// }

// /**
//  * Sends a push notification to all of a user's registered devices
//  * Does NOT create an in-app notification - that's handled separately
//  *
//  * @param userId - ID of the user to notify
//  * @param title - Title of the notification
//  * @param message - Message content of the notification
//  * @param data - Additional data to include with the notification
//  * @returns Results of the notification attempts
//  */
// export async function sendPushNotificationToUser(
//   userId: string,
//   title: string,
//   message: string,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   data: any = {}
// ) {
//   try {
//     // Find all push subscriptions for this user
//     const subscriptions = await prisma.pushSubscription.findMany({
//       where: { userId },
//     });
//     console.log("Subscriptions found:", subscriptions);

//     // If user has no subscriptions, return early
//     if (subscriptions.length === 0) {
//       return;
//     }

//     console.log(
//       `Sending push notifications to user ${userId} (${subscriptions.length} devices)`
//     );

//     // Convert database model to web push subscription format
//     const pushSubscriptions: PushSubscription[] = subscriptions.map((sub) => ({
//       endpoint: sub.endpoint,
//       expirationTime: null,
//       keys: {
//         p256dh: sub.p256dh,
//         auth: sub.auth,
//       },
//     }));

//     // Send push notification to each device
//     const results = await Promise.allSettled(
//       pushSubscriptions.map(async (subscription) => {
//         try {
//           return await sendPushNotification(
//             subscription,
//             title,
//             message,
//             undefined,
//             data
//           );
//         } catch (error) {
//           // If subscription is invalid/expired, remove it from database
//           console.log("error from catch", error);
//           if (
//             error instanceof Error &&
//             error.message === "Subscription expired"
//           ) {
//             await prisma.pushSubscription.delete({
//               where: { endpoint: subscription.endpoint },
//             });
//           }
//           return null;
//         }
//       })
//     );

//     return results;
//   } catch (error) {
//     console.error("Error sending push notifications:", error);
//   }
// }
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "developer.deepak25@gmail.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
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
  data: Record<string, unknown> = {}
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

  if (error instanceof Error && hasStatusCode(error) && error.statusCode === 410) {
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
  data: Record<string, unknown> = {}
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
      if (err instanceof Error && err.message === "Subscription expired") {
        await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        console.log("Removed expired subscription:", sub.endpoint);
      } else {
        console.error("Failed to send push notification to:", sub.endpoint, err);
      }
    }
  });

  return Promise.allSettled(promises);
}
