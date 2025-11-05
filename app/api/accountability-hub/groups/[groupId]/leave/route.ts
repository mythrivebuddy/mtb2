// api/accountability-hub/groups/[groupId]/leave/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

/**
 * @method DELETE
 * @route /api/groups/[groupId]/leave
 * @description Allows members to leave the group or admins to remove other members (via search params).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("userId"); // userId from query
    const actingUserId = session.user.id;

    if (!groupId) {
      return NextResponse.json({ message: "Group ID is required" }, { status: 400 });
    }

    // Fetch group info with members and roles
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        creatorId: true,
        coachId: true,
        members: {
          select: { userId: true, role: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === actingUserId && m.role.toLowerCase() === "admin"
    );

    // 🧩 CASE 1: Admin removing another member
    if (targetUserId && targetUserId !== actingUserId) {
      if (!isAdmin && !(session.user.role === "ADMIN")) {
        return NextResponse.json(
          { message: "Only admins can remove members." },
          { status: 403 }
        );
      }

      if ([group.creatorId, group.coachId].includes(targetUserId)) {
        return NextResponse.json(
          { message: "You cannot remove the creator or coach." },
          { status: 403 }
        );
      }

      const memberExists = group.members.some((m) => m.userId === targetUserId);
      if (!memberExists) {
        return NextResponse.json(
          { message: "User is not a member of this group." },
          { status: 400 }
        );
      }

      // Fetch names for activity log clarity
      const [actingUser, removedUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: actingUserId },
          select: { name: true },
        }),
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: { name: true },
        }),
      ]);

      await prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId: targetUserId,
            groupId,
          },
        },
      });

      await logActivity(
        groupId,
        actingUserId,
        "group_leave",
        `${actingUser?.name || "An admin"} removed ${
          removedUser?.name || "a member"
        } from the group.`
      );

      return NextResponse.json(
        { message: "Member removed successfully.", success: true },
        { status: 200 }
      );
    }

    // 🧩 CASE 2: Member leaving themselves
    if (group.creatorId === actingUserId || group.coachId === actingUserId) {
      return NextResponse.json(
        { message: "Admins (creator or coach) cannot leave the group." },
        { status: 403 }
      );
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: actingUserId,
          groupId,
        },
      },
    });

    await logActivity(
      groupId,
      actingUserId,
      "group_leave",
      `${session.user.name} left the group.`
    );

    return NextResponse.json(
      { message: "You have successfully left the group.", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEAVE_GROUP_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}
