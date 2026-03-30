import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// GET: Get all notifications for the user
export async function GET() {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;

    // Use transaction to fetch notifications and mark them as read
    const [notifications] = await prisma.$transaction([
      // First fetch all notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      // Then mark all unread notifications as read
      prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      }),
    ]);
    const sanitized = notifications.map((n) => {
      if (!n.message.includes("undefined")) return n;

      const metadata = n.metadata as Record<string, unknown> | null;
      const activity = metadata?.activity as string | undefined;
      const amount = metadata?.amount as number | undefined;

      if (activity === "STORE_PURCHASE") {
        return {
          ...n,
          message: `You spent ${amount ?? 0} GP for purchasing store items.`,
        };
      }

      if (activity === "STORE_SALE") {
        return {
          ...n,
          message: `You earned ${amount ?? 0} GP for selling store items.`,
        };
      }

      return n;
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
