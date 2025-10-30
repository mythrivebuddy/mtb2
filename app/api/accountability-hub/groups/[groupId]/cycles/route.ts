import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    // 1️⃣ Verify admin access
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: session.user.id,
        role: Role.ADMIN,
      },
    });

    if (!adminMembership) {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // 2️⃣ Find the active cycle for the group
    const activeCycle = await prisma.cycle.findFirst({
      where: { groupId, status: { in: ["active","repeat"] } },
    });

    if (!activeCycle) {
      return NextResponse.json(
        { error: "No active cycle found for this group." },
        { status: 404 }
      );
    }

    // 3️⃣ Delete related goals and comments for that cycle
    const goalIds = (
      await prisma.goal.findMany({
        where: { cycleId: activeCycle.id },
        select: { id: true },
      })
    ).map((g) => g.id);

    if (goalIds.length > 0) {
      await prisma.comment.deleteMany({ where: { goalId: { in: goalIds } } });
      await prisma.goal.deleteMany({ where: { id: { in: goalIds } } });
    }

    // 4️⃣ Delete activity feed items linked to this group
    await prisma.activityFeedItem.deleteMany({ where: { groupId } });

    // 5️⃣ Calculate new start and end dates
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // 6️⃣ Update the current cycle to "repeat" and refresh its dates
    const repeatedCycle = await prisma.cycle.update({
      where: { id: activeCycle.id },
      data: {
        status: "repeat",
        startDate,
        endDate,
        updatedAt: new Date(),
      },
    });

    // 7️⃣ Clear group notes
    await prisma.group.update({
      where: { id: groupId },
      data: { notes: null },
    });

    // 8️⃣ Log activity
    await logActivity(
      groupId,
      session.user.id,
      "cycle_started",
      `${session.user.name} marked the current cycle as repeat and refreshed its dates.`
    );

    return NextResponse.json(
      {
        message: "Cycle updated to 'repeat' successfully",
        cycle: repeatedCycle,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[REPEAT_CYCLE_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
