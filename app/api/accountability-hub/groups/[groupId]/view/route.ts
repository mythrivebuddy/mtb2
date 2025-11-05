// app/api/accountability-hub/groups/[groupId]/view/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        cycles: {
          where: { status: { in: ["active", "repeat"] } },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          // ✅ FIX: The field is named 'assignedAt' in your schema, not 'joinedAt'.
          orderBy: { assignedAt: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some((m) => m.userId === session.user.id);
    if (!isMember && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log(group);
    
    const activeCycleId = group.cycles[0]?.id;
    console.log("acitivecyccleid ",activeCycleId);
    
    let membersWithGoals = group.members;

    if (activeCycleId) {
      membersWithGoals = await Promise.all(
        group.members.map(async (member) => {
          const goals = await prisma.goal.findMany({
            where: { member: member, cycleId: activeCycleId },
            select: {
              id: true,
              text: true,
              midwayUpdate: true,
              notes: true,
              endResult: true,
              status: true,
              authorId: true,
            },
          });
          return { ...member, goals };
        })
      );
    }

    const requesterRole = group.members.find(
      (m) => m.userId === session.user.id
    )?.role;

    return NextResponse.json({
      name: group.name,
      group: group,
      activeCycleId: activeCycleId,
      members: membersWithGoals,
      requesterRole: requesterRole,
    });
  } catch (error) {
    console.error(`[GET_GROUP_VIEW]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
