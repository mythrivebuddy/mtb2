import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true, name: true }
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    // Get all unread notifications for this user
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        // isRead: false,
      },
      select: { id: true, title: true, message: true, type: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: 5 // Limit to prevent spam, adjust as needed
    });

    if (unreadNotifications.length === 0) {
      return NextResponse.json({ 
        message: "No unread notifications found",
        success: true 
      }, { status: 200 });
    }

    // Send push notification for the most recent unread notification
    const latestNotification = unreadNotifications[0];
    
    await sendPushNotificationToUser(
      user.id,
      latestNotification.title || "New Notification",
      latestNotification.message || "You have a new notification",
      { 
        notificationId: latestNotification.id,
        type: latestNotification.type
      }
    );

    return NextResponse.json({ 
      success: true,
      notificationsSent: 1,
      totalUnread: unreadNotifications.length
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ 
      error: "Failed to send push notification" 
    }, { status: 500 });
  }
}
