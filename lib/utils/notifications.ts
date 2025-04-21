import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  });
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
    `You earned ${amount} JP for ${activity}`,
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

export async function createSpotlightApprovedNotification(userId: string) {
  return createNotification(
    userId,
    NotificationType.SPOTLIGHT_APPROVED,
    "Spotlight Approved",
    "Your spotlight application has been approved",
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
