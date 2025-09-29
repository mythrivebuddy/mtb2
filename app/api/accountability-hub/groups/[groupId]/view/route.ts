// app/api/accountability-hub/groups/[groupId]/view/route.ts

import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    // Fetch the group and its members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        cycles: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if the current user is a member
    const isMember = group.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeCycleId = group.cycles[0]?.id;

    // Build members array with goals (instead of mutating)
    let membersWithGoals = group.members;

    if (activeCycleId) {
      membersWithGoals = await Promise.all(
        group.members.map(async (member) => {
          const goals = await prisma.goal.findMany({
            where: {
              memberId: member.id,
              cycleId: activeCycleId,
            },
            select: {
              id: true,
              text: true,
              midwayUpdate: true,
              endResult: true,
              status: true,
            },
          });

          return { ...member, goals };
        })
      );
    }

    // Find the role of the requester
    const requesterRole = group.members.find(
      (m) => m.userId === session.user.id
    )?.role;

    return NextResponse.json({
      name: group.name,
      activeCycleId,
      members: membersWithGoals,
      requesterRole,
    });
  } catch (error) {
    console.error(`[GET_GROUP_VIEW]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
