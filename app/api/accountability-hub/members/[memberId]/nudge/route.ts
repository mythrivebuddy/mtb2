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
    // BEST PRACTICE: Also check for name since we use it in the log
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
        role: "ADMIN",
      },
      include: {
        group: { select: { name: true } },
      },
    });

    // More robust check
    if (!adminMembership?.group) {
      return NextResponse.json({ error: "Forbidden: Not an admin of this group" }, { status: 403 });
    }
    
    // 2. Get recipient's details
    // <-- FIX 1: Find member by the combination of their userId and groupId.
    // This fixes the "'id' does not exist" error.
    const recipientMember = await prisma.groupMember.findFirst({ 
        where: {
            userId: memberId, // Use the memberId from params
            groupId: groupId, // Ensure they are in the correct group
        },
        // The select clause is correct, but the query to get here was not.
        select: { userId: true, user: { select: { name: true } } }
    });

    // More robust check. This also fixes the "'user' does not exist" error.
    if (!recipientMember?.user) {
        return NextResponse.json({ error: "Recipient member not found in this group" }, { status: 404 });
    }

    // 3. Create the notification using your existing service
    const message = `A friendly nudge from your coach: Keep going on your goal in the "${adminMembership.group.name}" group!`;
    const link = `/dashboard/accountability-hub?groupId=${groupId}`;
    
    await NotificationService.createNotification(
        recipientMember.userId,
        message,
        link
    );

    // 4. Log the activity
    // <-- FIX 2: Provide all 4 required arguments. The missing one was the 'actorId'.
    await logActivity(
      groupId,
      'member_added', // Use an allowed ActivityType value
      `${session.user.name} sent a nudge to ${recipientMember.user.name}.`,
      session.user.id // The logged-in user is the "actor" performing the action
    );

    return NextResponse.json({ success: true, message: "Nudge sent successfully" });
  } catch (error) {
    console.error(`[SEND_NUDGE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}