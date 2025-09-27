// app/api/accountability-hub/groups/[groupId]/members/route.ts

import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { logActivity } from "@/lib/activity-logger";

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

    // First, verify the current user is actually a member of this group
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    // Fetch the active cycle for this group to get the right goals
    const activeCycle = await prisma.cycle.findFirst({
        where: {
            groupId: groupId,
            status: 'active'
        },
        orderBy: { startDate: 'desc' }
    });


    // Now, fetch all members of the group and include their user details
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        // Also include the goal for the current active cycle
        goals: {
            where: {
                cycleId: activeCycle?.id
            }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;
    const { userIdToAdd } = await req.json();

    if (!userIdToAdd) {
      return NextResponse.json(
        { error: "User ID to add is required" },
        { status: 400 }
      );
    }

    // Security Check: Verify that the current user is an admin of this group
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
        role: "admin",
      },
    });

    if (!adminMembership) {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }
    
    // Check if the user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
        where: {
            userId_groupId: {
                userId: userIdToAdd,
                groupId: groupId
            }
        }
    });

    if (existingMembership) {
        return NextResponse.json({ error: "User is already in this group" }, { status: 409 });
    }

    // Add the new member
    const newMember = await prisma.groupMember.create({
      data: {
        userId: userIdToAdd,
        groupId: groupId,
        role: "member", // New users are always added as 'member'
      },
    });

    const userBeingAdded = await prisma.user.findUnique({ where: { id: userIdToAdd }});

    // Log this activity
    if (userBeingAdded) {
      await logActivity(
        groupId,
        'member_added',
        `${session.user.name} added ${userBeingAdded.name} to the group.`
      );
    }

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error(`[ADD_GROUP_MEMBER]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}