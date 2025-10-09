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

    // Check membership using composite key (userId + groupId)
    const memberRecord = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: currentUserId, groupId } },
      select: { userId: true, groupId: true }, // just confirm existence
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Build the unique identifier for Goal using the composite unique on (authorId, cycleId).
    const uniqueGoalIdentifier = {
      authorId_cycleId: {
        authorId: currentUserId, // authorId == GroupMember.userId
        cycleId: cycleId,
      },
    };

    let goal;
    const dataToUpdate: Record<string, unknown> = { [field]: value };

    if (field === "text") {
      goal = await prisma.goal.upsert({
        where: uniqueGoalIdentifier,
        update: dataToUpdate,
        create: {
          text: value,
          authorId: currentUserId,
          groupId: groupId,
          cycleId: cycleId,
        },
      });
    } else {
      // Using update — will throw Prisma P2025 if not found
      goal = await prisma.goal.update({
        where: uniqueGoalIdentifier,
        data: dataToUpdate,
      });
    }

    return NextResponse.json(goal);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "You must set a main goal before adding progress updates." },
        { status: 400 }
      );
    }

    console.error(`[GOAL_UPDATE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
