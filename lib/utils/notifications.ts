import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activityDisplayMap } from "../constants/activityNames";
import { sendPushNotification, PushSubscription } from "./webPushUtils";

// Helper function to create a notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
) {
  return prisma.notification.create({
    data: { userId, type, title, message, metadata },
  });
}

// Returns notification data for JP earned
export function getJPEarnedNotificationData(
  userId: string,
  amount: number,
  activity: string
) {
  return {
    userId,
    type: NotificationType.JP_EARNED,
    title: "JP Earned",
    message: `You earned ${amount} JP for ${activityDisplayMap[activity]}`,
    metadata: { amount, activity },
  };
}

// Returns notification data for prosperity applied
export function getProsperityAppliedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.PROSPERITY_APPLIED,
    title: "Prosperity Drop Applied",
    message:
      "Your prosperity drop application has been submitted and is under review",
    metadata: {},
  };
}

// Returns notification data for spotlight approved
export function getSpotlightApprovedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_APPROVED,
    title: "Spotlight Approved",
    message: "Your spotlight application has been approved",
    metadata: { url: "/dashboard/spotlight" },
  };
}

// Returns notification data for spotlight approved
export function getSpotlightAppliedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_APPLIED,
    title: "Spotlight Applied",
    message: "You have applied for spotlight and it is under review",
    metadata: {},
  };
}

// Returns notification data for spotlight active
export function getSpotlightActiveNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_ACTIVE,
    title: "Spotlight Active",
    message: "Your spotlight is now active and visible to other users",
    metadata: {},
  };
}

// Returns notification data for magic box shared
export function getMagicBoxSharedNotificationData(
  sharedByUserId: string,
  sharedByUserName: string,
  receiverUserId: string,
  amount: number
) {
  return {
    userId: receiverUserId,
    type: NotificationType.MAGIC_BOX_SHARED,
    title: "Magic Box Received",
    message: `${sharedByUserName} shared ${amount} JP with you through a Magic Box!`,
    metadata: { sharedByUserId, sharedByUserName, amount },
  };
}

// Returns notification data for spotlight transaction (spending JP to activate)
export function getSpotlightTransactionNotificationData(
  userId: string,
  jpAmount: number
) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_ACTIVE,
    title: "Spotlight Activated",
    message: `You spent ${jpAmount} JP to activate your Spotlight.`,
    metadata: { jpAmount },
  };
}

// Returns notification data for spotlight application (spending JP to apply)
export function getSpotlightAppliedTransactionNotificationData(
  userId: string,
  jpAmount: number
) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_APPROVED,
    title: "Spotlight Application Submitted",
    message: `You spent ${jpAmount} JP to apply for Spotlight.`,
    metadata: { jpAmount },
  };
}

export async function createJPEarnedNotification(
  userId: string,
  amount: number,
  activity: string
) {
  return createNotification(
    userId,
    NotificationType.JP_EARNED,
    "JP Earned",
    `You earned ${amount} JP for ${activityDisplayMap[activity]}`,
    { amount, activity }
  );
}

export async function createProsperityAppliedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.PROSPERITY_APPLIED,
    "Prosperity Drop Applied",
    "Your prosperity drop application has been submitted and is under review",
    {}
  );
}

/**
 * Create a notification for spotlight approval and send push notification if applicable
 * @param userId - ID of the user to notify
 */
export async function createSpotlightApprovedNotification(userId: string) {
  // Create in-app notification
  const notification = await createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPROVED,
    "Spotlight Approved",
    "Your spotlight application has been approved",
    { url: "/dashboard/spotlight" }
  );

  // Send push notification if the user has push subscriptions
  await sendPushNotificationToUser(
    userId,
    "Spotlight Approved",
    "Your spotlight application has been approved. Congratulations!"
  );

  return notification;
}

export async function createSpotlightAppliedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPLIED,
    "Spotlight Applied",
    "You have applied for spotlight and it is under review",
    {}
  );
}

export async function createSpotlightActiveNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_ACTIVE,
    "Spotlight Active",
    "Your spotlight is now active and visible to other users",
    {}
  );
}

export async function createMagicBoxSharedNotification(
  sharedByUserId: string,
  sharedByUserName: string,
  receiverUserId: string,
  amount: number
) {
  return createNotification(
    receiverUserId,
    NotificationType.MAGIC_BOX_SHARED,
    "Magic Box Received",
    `${sharedByUserName} shared ${amount} JP with you through a Magic Box!`,
    { sharedByUserId, sharedByUserName, amount }
  );
}

/**
 * Sends a push notification to all of a user's registered devices
 * @param userId - ID of the user to notify
 * @param title - Title of the notification
 * @param message - Message content of the notification
 * @param data - Additional data to include with the notification
 * @returns Results of the notification attempts
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any = {}
) {
  try {
    // Find all push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    // If user has no subscriptions, return early
    if (subscriptions.length === 0) {
      return;
    }

    console.log(
      `Sending push notifications to user ${userId} (${subscriptions.length} devices)`
    );

    // Convert database model to web push subscription format
    const pushSubscriptions: PushSubscription[] = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      expirationTime: null,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send push notification to each device
    const results = await Promise.allSettled(
      pushSubscriptions.map(async (subscription) => {
        try {
          return await sendPushNotification(
            subscription,
            title,
            message,
            undefined,
            data
          );
        } catch (error: any) {
          // If subscription is invalid/expired, remove it from database
          if (error.message === "Subscription expired") {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            });
          }
          return null;
        }
      })
    );

    return results;
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}
