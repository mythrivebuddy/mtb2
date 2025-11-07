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
  return await prisma.notification.create({
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
    message: `You earned ${amount} JP for ${activityDisplayMap[activity]}.`,
    metadata: { amount, activity },
  };
}

// Returns notification data for Prosperity Drop application
export function getProsperityAppliedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.PROSPERITY_APPLIED,
    title: "Prosperity Drop Applied",
    message:
      "Your Prosperity Drop application has been submitted and is under review.",
    metadata: {},
  };
}

// Returns notification data for Spotlight approval
export function getSpotlightApprovedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_APPROVED,
    title: "Spotlight Approved",
    message: "Your Spotlight application has been approved.",
    metadata: { url: "/dashboard/spotlight" },
  };
}

// Returns notification data for Spotlight application
export function getSpotlightAppliedNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_APPLIED,
    title: "Spotlight Applied",
    message: "You have applied for Spotlight. Your request is under review.",
    metadata: {},
  };
}

// Returns notification data for active Spotlight
export function getSpotlightActiveNotificationData(userId: string) {
  return {
    userId,
    type: NotificationType.SPOTLIGHT_ACTIVE,
    title: "Spotlight Active",
    message: "Your Spotlight is now active and visible to other users.",
    metadata: {},
  };
}

// Returns notification data for Magic Box sharing
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

// Returns notification data for Magic Box reward (sender)
export function getMagicBoxRewardNotificationData(
  userId: string,
  amount: number
) {
  return {
    userId,
    type: NotificationType.JP_EARNED,
    title: "Magic Box Reward",
    message: `You earned ${amount} JP from opening a Magic Box!`,
  };
}

// Returns notification data for Spotlight transaction (spending JP)
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

// Returns notification data for Spotlight application transaction
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

// Create JP earned notification
export async function createJPEarnedNotification(
  userId: string,
  amount: number,
  activity: string
) {
  return createNotification(
    userId,
    NotificationType.JP_EARNED,
    "JP Earned",
    `You earned ${amount} JP for ${activityDisplayMap[activity]}.`,
    { amount, activity }
  );
}

// Create JP spent notification
export async function createJpSpentNotification(
  userId: string,
  amount: number,
  activity: string
) {
  return createNotification(
    userId,
    NotificationType.JP_SPEND,
    "JP Spent",
    `You spent ${amount} JP for ${activityDisplayMap[activity]}.`,
    { amount, activity }
  );
}

export async function createProsperityAppliedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.PROSPERITY_APPLIED,
    "Prosperity Drop Applied",
    "Your Prosperity Drop application has been submitted and is under review.",
    {}
  );
}

/**
 * Creates a notification for Prosperity Drop approval.
 */
export async function createProsperityApprovedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.PROSPERITY_APPROVED,
    "Prosperity Drop Approved",
    "Your Prosperity Drop application has been approved."
  );
}

/**
 * Creates a notification for Spotlight approval.
 */
export async function createSpotlightApprovedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPROVED,
    "Spotlight Approved",
    "Your Spotlight application has been approved.",
    { url: "/dashboard/spotlight" }
  );
}

export async function createSpotlightAppliedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPLIED,
    "Spotlight Applied",
    "You have applied for Spotlight. Your request is under review.",
    {}
  );
}

export async function createSpotlightActiveNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_ACTIVE,
    "Spotlight Active",
    "Your Spotlight is now active and visible to other users.",
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

// BuddyLens — Request Claimed
export function getBuddyLensClaimedNotificationData(
  userId: string,
  reviewerName: string,
  domain: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_CLAIMED,
    title: "BuddyLens Request Claimed",
    message: `${reviewerName} claimed your BuddyLens request in ${domain}. You can approve or reject it.`,
    metadata: { url: `/dashboard/buddy-lens/approve` },
  };
}

// BuddyLens — Claim Approved
export function getBuddyLensApprovedNotificationData(
  userId: string,
  domain: string,
  requestId: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_APPROVED,
    title: "BuddyLens Claim Approved",
    message: `Your claim for the BuddyLens request in ${domain} has been approved! You can start reviewing now.`,
    metadata: { url: `/dashboard/buddy-lens/reviewer?requestId=${requestId}` },
  };
}

// BuddyLens — Claim Rejected
export function getBuddyLensRejectedNotificationData(
  userId: string,
  domain: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_REJECTED,
    title: "BuddyLens Claim Rejected",
    message: `Your claim for the BuddyLens request in ${domain} was rejected.`,
    metadata: { url: `/dashboard/buddy-lens/reviewer` },
  };
}

// BuddyLens — Review Completed
export function getBuddyLensReviewedNotificationData(
  userId: string,
  domain: string,
  jpAmount: number,
  requestId: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_REVIEWED,
    title: "BuddyLens Review Completed",
    message: `Your BuddyLens request in ${domain} has been reviewed. ${jpAmount} Joy Pearls have been deducted.`,
    metadata: { url: `/dashboard/buddy-lens/reviewer/${requestId}`, jpAmount },
  };
}

// BuddyLens — Reviewer Rewarded
export function getBuddyLensReviewerCompletedNotificationData(
  userId: string,
  domain: string,
  jpAmount: number,
  requestId: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_COMPLETED,
    title: "BuddyLens Review Reward",
    message: `You earned ${jpAmount} Joy Pearls for reviewing a BuddyLens request in ${domain}.`,
    metadata: { url: `/dashboard/buddy-lens/reviewer/${requestId}`, jpAmount },
  };
}

// BuddyLens — Claim Cancelled
export function getBuddyLensCancelledNotificationData(
  userId: string,
  domain: string
) {
  return {
    userId,
    type: NotificationType.BUDDY_LENS_REJECTED,
    title: "BuddyLens Claim Cancelled",
    message: `The claim for your BuddyLens request in ${domain} has been cancelled by the requester.`,
    metadata: { url: `/dashboard/buddy-lens/reviewer` },
  };
}

// --- Create Notification Variants (Async versions) ---

export async function createBuddyLensClaimedNotification(
  userId: string,
  reviewerName: string,
  domain: string,
  requestId: string
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_CLAIMED,
    "BuddyLens Request Claimed",
    `${reviewerName} claimed your BuddyLens request in ${domain}. You can approve or reject it.`,
    { url: `/dashboard/buddy-lens/approve?requestId=${requestId}` }
  );
}

export async function createBuddyLensApprovedNotification(
  userId: string,
  domain: string,
  requestId: string
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_APPROVED,
    "BuddyLens Claim Approved",
    `Your claim for the BuddyLens request in ${domain} has been approved! You can start reviewing now.`,
    { url: `/dashboard/buddy-lens/reviewer?requestId=${requestId}` }
  );
}

export async function createBuddyLensRejectedNotification(
  userId: string,
  domain: string
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_REJECTED,
    "BuddyLens Claim Rejected",
    `Your claim for the BuddyLens request in ${domain} was rejected.`,
    { url: `/dashboard/buddy-lens/reviewer` }
  );
}

export async function createBuddyLensReviewedNotification(
  userId: string,
  domain: string,
  jpAmount: number,
  reviewId: string
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_REVIEWED,
    "BuddyLens Review Completed",
    `Your BuddyLens request in ${domain} has been reviewed. ${jpAmount} Joy Pearls have been deducted.`,
    { url: `/dashboard/buddy-lens/reviewer/${reviewId}`, jpAmount }
  );
}

export async function createBuddyLensReviewerCompletedNotification(
  userId: string,
  domain: string,
  jpAmount: number
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_COMPLETED,
    "BuddyLens Review Reward",
    `You earned ${jpAmount} Joy Pearls for reviewing a BuddyLens request in ${domain}.`
  );
}

export async function createBuddyLensCancelledNotification(
  userId: string,
  domain: string
) {
  return createNotification(
    userId,
    NotificationType.BUDDY_LENS_REJECTED,
    "BuddyLens Claim Cancelled",
    `The claim for your BuddyLens request in ${domain} has been cancelled by the requester.`,
    { url: `/dashboard/buddy-lens/reviewer` }
  );
}
