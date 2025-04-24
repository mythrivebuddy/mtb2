import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activityDisplayMap } from "../constants/activityNames";

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
 * Create a notification for prosperity approval (in-app only, no push)
 * @param userId - ID of the user to notify
 */
export async function createProsperityApprovedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.PROSPERITY_APPROVED,
    "Prosperity Drop Approved",
    "Your prosperity drop application has been approved",
    // { url: "/dashboard/prosperity" }
  );
}

/**
 * Create a notification for spotlight approval (in-app only, no push)
 * @param userId - ID of the user to notify
 */
export async function createSpotlightApprovedNotification(userId: string) {
  // Create in-app notification only
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPROVED,
    "Spotlight Approved",
    "Your spotlight application has been approved",
    { url: "/dashboard/spotlight" }
  );
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
