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

    const { groupId } = params;
    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

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
    
    const isMember = group.members.some(m => m.userId === session.user.id);
    if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeCycleId = group.cycles[0]?.id;
    let membersWithGoals = group.members;

    // --- THIS IS THE FIX ---
    // Instead of modifying the member objects in a loop (which requires 'as any'),
    // we create a new, correctly typed array of members that includes their goals.
    if (activeCycleId) {
        membersWithGoals = await Promise.all(
            group.members.map(async (member) => {
                const goals = await prisma.goal.findMany({
                    where: { memberId: member.id, cycleId: activeCycleId },
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
    // ----------------------

    const requesterRole = group.members.find(m => m.userId === session.user.id)?.role;

    return NextResponse.json({
        name: group.name,
        activeCycleId: activeCycleId,
        members: membersWithGoals, // Use the new, correctly typed array
        requesterRole: requesterRole
    });

  } catch (error) {
    console.error(`[GET_GROUP_VIEW]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}