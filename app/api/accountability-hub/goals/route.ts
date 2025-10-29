import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client"; // ✅ FIX: Import Role for admin check

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessionUserId = session.user.id; // The person making the request

    const { groupId, cycleId, field, value, authorId } = await req.json();

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

    // ✅ START FIX: Determine the target user and check permissions

    let targetAuthorId = sessionUserId; // Default to self (the logged-in user)

    // If an authorId is provided AND it's different from the session user,
    // it means an admin is trying to edit someone else's goal.
    if (authorId && authorId !== sessionUserId) {
      // 1. Check if the logged-in user is an admin of this group
      const adminMemberRecord = await prisma.groupMember.findFirst({
        where: {
          userId: sessionUserId,
          groupId: groupId,
          role: Role.ADMIN, // Use the Prisma enum
        },
      });

      if (!adminMemberRecord) {
        return NextResponse.json(
          { error: "Forbidden: You do not have admin rights to edit this goal" },
          { status: 403 }
        );
      }

      // 2. If they are an admin, set the target to the user from the request
      targetAuthorId = authorId;
    }
    // ✅ END FIX

    // Check membership for the *target* user
    const memberRecord = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetAuthorId, groupId } },
      select: { userId: true, groupId: true }, // just confirm existence
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Target user is not a member of this group" },
        { status: 403 }
      );
    }

    // Build the unique identifier for Goal using the *targetAuthorId*
    const uniqueGoalIdentifier = {
      authorId_cycleId: {
        authorId: targetAuthorId, // ✅ FIX: Use targetAuthorId
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
          authorId: targetAuthorId, // ✅ FIX: Use targetAuthorId
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
