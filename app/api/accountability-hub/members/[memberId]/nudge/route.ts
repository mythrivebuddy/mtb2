// app/api/accountability-hub/members/[memberId]/nudge/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { NotificationService } from "@/lib/notification-service";
import { Role } from "@prisma/client"; // Import the Role enum

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

    // 1. Verify admin status and get group name
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: Role.ADMIN,
      },
      include: {
        group: { select: { name: true } }, // <-- FIX #1: Was 'Group', now matches the correct schema
      },
    });

    if (!adminMembership || !adminMembership.group) { // <-- FIX #2: Was 'Group'
      return NextResponse.json({ error: "Forbidden: Not an admin or group not found" }, { status: 403 });
    }
    
    // 2. Get recipient's details
    const recipientMember = await prisma.groupMember.findUnique({
        where: { id: memberId },
        include: { user: { select: { name: true, id: true } } }
    });

    if (!recipientMember || !recipientMember.user.name) {
        return NextResponse.json({ error: "Recipient member not found" }, { status: 404 });
    }

    // 3. Create the notification using your existing service
    const message = `A friendly nudge from your coach: Keep going on your goal in the "${adminMembership.group.name}" group!`; // <-- FIX #3: Was 'Group'
    const link = `/dashboard/accountability-hub?groupId=${groupId}`;
    
    await NotificationService.createNotification(
        recipientMember.userId,
        message,
        link
    );

    // 4. Log the activity
    await logActivity(
        groupId,
        'goal_updated',
        `${session.user.name} sent a nudge to ${recipientMember.user.name}.`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[SEND_NUDGE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}