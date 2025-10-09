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
    const userId = session.user.id;

    // 1. Permission check (no changes needed here)
    const cycleForPermissionCheck = await prisma.cycle.findUnique({
      where: { id: cycleId },
      select: {
        group: {
          select: {
            members: {
              where: { userId: userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!cycleForPermissionCheck?.group?.members?.length) {
      return NextResponse.json(
        { error: "Cycle not found or you are not a member of this group." },
        { status: 404 }
      );
    }
    
    // 2. Fetch all data for the report with the correct relation
    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: {
        group: true,
        goals: {
          include: {
            // ✅ CORRECTED: Include the 'member' relation, and then the 'user' within it.
            member: {
              include: {
                user: {
                  select: { name: true, image: true, id: true },
                },
              },
            },
            comments: true,
          },
        },
      },
    });
    
    if (!cycle) {
        return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
    }

    const allMembers = await prisma.groupMember.findMany({
        where: { groupId: cycle.groupId },
        include: { user: { select: { name: true, image: true, id: true } } }
    });

    // --- Calculate Highlights ---
    const memberActivity: {
      [userId: string]: { name: string; updates: number; comments: number };
    } = {};

    // Initialize all members
    allMembers.forEach((m) => {
        if(m.user?.name) {
           memberActivity[m.userId] = { name: m.user.name, updates: 0, comments: 0 };
        }
    });

    // Calculate updates and comments
    for (const goal of cycle.goals) {
      // ✅ CORRECTED: Access the author's ID through the new 'member' relation.
      // The goal.member object contains the userId.
      if (goal.member) {
        const goalUserId = goal.member.userId;
        if (memberActivity[goalUserId]) {
          if (goal.text) memberActivity[goalUserId].updates++;
          if (goal.midwayUpdate) memberActivity[goalUserId].updates++;
          if (goal.endResult) memberActivity[goalUserId].updates++;
        }
      }

      for (const comment of goal.comments) {
        if (memberActivity[comment.authorId]) {
          memberActivity[comment.authorId].comments++;
        }
      }
    }

    const sortedByActivity = Object.values(memberActivity).sort(
      (a, b) => (b.updates + b.comments) - (a.updates + a.comments)
    );
    const sortedBySupport = Object.values(memberActivity).sort(
      (a, b) => b.comments - a.comments
    );

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
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
