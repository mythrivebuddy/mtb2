// api/accountability-hub/goals/[goalId]/update-notes/route.ts
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

export async function PATCH(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessionUserId = session.user.id;
    const { goalId } = params;
    const { notes } = await req.json();

    if (typeof notes === "undefined") {
      return NextResponse.json(
        { error: "Missing 'notes' field in request body" },
        { status: 400 }
      );
    }

    // 1. Find the goal to get its group
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { groupId: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // 2. Check if the session user is an ADMIN of that group
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        userId: sessionUserId,
        groupId: goal.groupId,
        role: Role.ADMIN,
      },
    });

    if (!adminMembership) {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // 3. User is authorized, update the notes
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { notes: notes || null }, // Save empty string as null
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error(`[GOAL_NOTES_UPDATE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
