// app/api/accountability-hub/groups/[groupId]/members/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { GroupRole } from "@prisma/client";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const userMembership = await prisma.groupMember.findFirst({
      where: { groupId: groupId, userId: session.user.id },
    });

    if (!userMembership && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeCycle = await prisma.cycle.findFirst({
      where: { groupId: groupId, status: "active" },
      orderBy: { startDate: "desc" },
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        goals: {
          where: { cycleId: activeCycle?.id },
        },
      },

      orderBy: { assignedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error(`[GET_GROUP_MEMBERS]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const { userIdToAdd } = await req.json();

    if (!userIdToAdd) {
      return NextResponse.json(
        { error: "User ID to add is required" },
        { status: 400 }
      );
    }
    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
    });
    if (!userToAdd) {
      return NextResponse.json(
        { error: "User to add not found" },
        { status: 404 }
      );
    }
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
        role: GroupRole.ADMIN, // Ensure you use the enum value
      },
    });

    if (!adminMembership && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    const existingMembership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: userIdToAdd, groupId: groupId } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already in this group" },
        { status: 409 }
      );
    }

    const newMember = await prisma.groupMember.create({
      data: {
        userId: userIdToAdd,
        groupId: groupId,
        assignedBy: session.user.id, // It's good practice to log who assigned the member
        role: GroupRole.MEMBER, // Ensure you use the enum value
      },
    });

    //  Get users with active push subscriptions
    const userHavePushSubscription = await prisma.pushSubscription.findFirst({
      where: { user: { id: userToAdd.id } },
    });

    const groupUrl = `${process.env.NEXT_URL}/dashboard/accountability-hub?groupId=${groupId}`;

    // Prepare email configuration
    await sendEmailUsingTemplate({
      toEmail: userToAdd.email,
      toName: userToAdd.name,
      templateId: "user-added-to-accountability-hub-group",
      templateData: {
        groupUrl,
        groupName: group.name,
        userName: userToAdd.name,
      },
    });
    if (userHavePushSubscription) {
      // Send push notification
      sendPushNotificationToUser(
        userToAdd.id,
        `You've been added to the Accountability Hub Group!`,
        `Hi ${userToAdd.name}, you’ve been added to the group ${group.name}. Tap to view your group and start working on your goals!`,
        { url: groupUrl }
      );
    }
    // logging activity
    await logActivity(
      groupId,
      session.user.id,
      "member_added",
      `${session.user.name} added ${userToAdd.name} to the group.`
    );

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error(`[ADD_GROUP_MEMBER]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
