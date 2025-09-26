// app/api/accountability-hub/goals/route.ts
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { logActivity } from "@/lib/activity-logger";

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
    const uniqueGoalIdentifier = {
      memberId_cycleId: {
        memberId: memberRecord.id,
        cycleId: cycleId,
      },
    };

    // If we are setting the main goal text, we can create it if it doesn't exist.
    if (field === 'text') {
        goal = await prisma.goal.upsert({
            where: uniqueGoalIdentifier,
            update: dataToUpdate,
            create: {
                text: value, // Ensure the required 'text' field is present on create
                memberId: memberRecord.id,
                groupId: groupId,
                cycleId: cycleId,
            },
        });
    } else {
        // For progress updates (midway, end, status), we should only UPDATE an existing goal.
        goal = await prisma.goal.update({
            where: uniqueGoalIdentifier,
            data: dataToUpdate,
        });
    }

    if (field === 'text') {
        await logActivity(groupId, 'goal_updated', `${session.user.name} updated their goal.`);
    }
    if (field === 'status') {
        await logActivity(groupId, 'status_updated', `${session.user.name}'s status was updated to "${value}".`);
    }

    return NextResponse.json(goal);
  } catch (error) {
    // This specifically catches the error if .update() fails because the goal doesn't exist
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