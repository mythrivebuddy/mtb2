// app/api/accountability-hub/groups/[groupId]/members/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// --- GET function to fetch all members of a group ---
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
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    // Security check: Make sure the requester is part of the group
    const userMembership = await prisma.groupMember.findFirst({
      where: { groupId: groupId, userId: session.user.id },
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Find the active cycle to filter goals correctly
    const activeCycle = await prisma.cycle.findFirst({
        where: { groupId: groupId, status: 'active' },
        orderBy: { startDate: 'desc' }
    });

    // --- THIS IS THE FIX ---
    // The query now fetches GroupMembers and includes their related 'user' and 'goals'
    const members = await prisma.groupMember.findMany({
      where: { groupId: groupId },
      include: {
        user: { // Include the user details for this member
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        goals: { // ALSO include the goals for this member
            where: {
                cycleId: activeCycle?.id
            }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error(`[GET_GROUP_MEMBERS]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// --- POST function to add a new member ---
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
      return NextResponse.json({ error: "User ID to add is required" }, { status: 400 });
    }

    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
        role: "admin",
      },
    });

    if (!adminMembership) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }
    
    const existingMembership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: userIdToAdd, groupId: groupId } }
    });

    if (existingMembership) {
        return NextResponse.json({ error: "User is already in this group" }, { status: 409 });
    }

    const newMember = await prisma.groupMember.create({
      data: {
        userId: userIdToAdd,
        groupId: groupId,
        role: "member",
      },
    });

    const userBeingAdded = await prisma.user.findUnique({ where: { id: userIdToAdd }});

    if (userBeingAdded && session.user.name) {
      await logActivity(
        groupId,
        'member_added',
        `${session.user.name} added ${userBeingAdded.name} to the group.`
      );
    }

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error(`[ADD_GROUP_MEMBER]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}