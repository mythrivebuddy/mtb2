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
      authorId_cycleId: {
        authorId: memberRecord.userId,
        cycleId: cycleId,
      },
    };
    
    if (field === "text") {
      goal = await prisma.goal.upsert({
        where: uniqueGoalIdentifier,
        update: dataToUpdate,
        create: {
          text: value,
          authorId: memberRecord.userId,
          groupId: groupId,
          cycleId: cycleId,
          status: "IN_PROGRESS",
        },
      });
    } else {
      goal = await prisma.goal.update({
        where: uniqueGoalIdentifier,
        data: dataToUpdate,
      });
    }

    if (field === "text") {
      // FIX: Add currentUserId as the first argument
      await logActivity(
        currentUserId,
        groupId,
        "goal_updated",
        `${session.user.name} updated their goal.`
      );
    }
    if (field === "status") {
      // FIX: Add currentUserId as the first argument
      await logActivity(
        currentUserId,
        groupId,
        "status_updated",
        `${session.user.name}'s status was updated to "${value}".`
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
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