import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

/**
 * Sends the most recent unread notification to a specific user
 * @param userId - ID of the user
 * @returns An object with notification status
 */
export async function sendLatestUnreadNotification(userId: string) {
  try {
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        metadata: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (unreadNotifications.length === 0) {
      return {
        success: true,
        message: "No unread notifications found",
        notificationsSent: 0,
      };
    }

    const latestNotification = unreadNotifications[0];

    await sendPushNotificationToUser(
      userId,
      latestNotification.title || "New Notification",
      latestNotification.message || "You have a new notification",
      {
        notificationId: latestNotification.id,
        type: latestNotification.type,
      }
    );

    return {
      success: true,
      message: "Notification sent",
      notificationsSent: 1,
      totalUnread: unreadNotifications.length,
    };
  } catch (error) {
    console.error("Error in sendLatestUnreadNotification:", error);
    return {
      success: false,
      error: "Failed to send push notification",
    };
  }
}
