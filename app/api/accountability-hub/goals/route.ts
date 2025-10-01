// app/api/accountability-hub/goals/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    const { groupId, cycleId, field, value } = await req.json();

    if (
      !groupId ||
      !cycleId ||
      !field ||
      !["text", "midwayUpdate", "endResult", "status"].includes(field)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const memberRecord = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: currentUserId, groupId: groupId } },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    let goal;
    const dataToUpdate = { [field]: value };
    
    // --- THIS IS THE FIX ---
    // The unique identifier for a Goal is 'memberId_cycleId', not 'authorId_cycleId'.
    const uniqueGoalIdentifier = {
      memberId_cycleId: {
        memberId: memberRecord.id,
        cycleId: cycleId,
      },
    };
    // -----------------------

    if (field === 'text') {
        goal = await prisma.goal.upsert({
            where: uniqueGoalIdentifier,
            update: dataToUpdate,
            create: {
                text: value,
                memberId: memberRecord.id,
                groupId: groupId,
                cycleId: cycleId,
            },
        });
    } else {
        goal = await prisma.goal.update({
            where: uniqueGoalIdentifier,
            data: dataToUpdate,
        });
    }

    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
         return NextResponse.json(
            { error: "You must set a main goal before adding progress updates." },
            { status: 400 }
        );
    }
    
    console.error(`[GOAL_UPDATE_ERROR]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}