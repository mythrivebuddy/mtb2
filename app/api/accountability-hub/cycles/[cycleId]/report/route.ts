// app/api/accountability-hub/cycles/[cycleId]/report/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cycleId } = params;

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: {
        group: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        goals: {
          include: {
            member: { include: { user: true } },
            comments: true,
          },
        },
      },
    });

    if (!cycle || cycle.group.members.length === 0) {
      return NextResponse.json({ error: "Forbidden or not found" }, { status: 404 });
    }

    // --- Calculate Highlights ---
    const memberActivity: { [userId: string]: { name: string, updates: number, comments: number } } = {};

    // Initialize all members
    const allMembers = await prisma.groupMember.findMany({ 
        where: { groupId: cycle.groupId }, 
        include: { user: { select: { name: true, image: true, id: true }}}
    });

    allMembers.forEach(m => {
        memberActivity[m.userId] = { name: m.user.name || 'Unknown', updates: 0, comments: 0 };
    });

    // Calculate updates and comments
    for (const goal of cycle.goals) {
      const userId = goal.member.userId;
      if (memberActivity[userId]) {
        if (goal.text) memberActivity[userId].updates++;
        if (goal.midwayUpdate) memberActivity[userId].updates++;
        if (goal.endResult) memberActivity[userId].updates++;
      }
      for (const comment of goal.comments) {
          if (memberActivity[comment.authorId]) {
              memberActivity[comment.authorId].comments++;
          }
      }
    }

    const sortedByActivity = Object.values(memberActivity).sort((a, b) => b.updates - a.updates);
    const sortedBySupport = Object.values(memberActivity).sort((a, b) => b.comments - a.comments);

    const report = {
      cycle,
      members: allMembers,
      highlights: {
        mostActive: sortedByActivity[0] || null,
        mostSupportive: sortedBySupport[0] || null,
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error(`[GET_CYCLE_REPORT_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
} 