// app/api/accountability-hub/members/[memberId]/nudge/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { NotificationService } from "@/lib/notification-service";

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = params;
    const { groupId } = await req.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: "admin",
      },
      include: {
        group: { select: { name: true } },
      },
    });

    if (!adminMembership) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }
    
    const recipientMember = await prisma.groupMember.findUnique({
        where: { id: memberId },
        include: { user: { select: { name: true, id: true } } }
    });

    if (!recipientMember || !recipientMember.user.name) {
        return NextResponse.json({ error: "Recipient member not found" }, { status: 404 });
    }

    const message = `A friendly nudge from your coach: Keep going on your goal in the "${adminMembership.group.name}" group!`;
    const link = `/dashboard/accountability-hub?groupId=${groupId}`;
    
    await NotificationService.createNotification(
        recipientMember.userId,
        message,
        link
    );

    // --- THIS IS THE FIX ---
    // The call to logActivity now correctly uses only 3 arguments.
    await logActivity(
        groupId,
        'goal_updated',
        `${session.user.name} sent a nudge to ${recipientMember.user.name}.`
    );
    // -----------------------

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[SEND_NUDGE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}