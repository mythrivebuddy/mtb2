// app/api/accountability-hub/groups/[groupId]/cycles/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { Role } from "@prisma/client"; // <-- Import the Role enum

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

    // 1. Verify the user is an admin of this group
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
        role: Role.ADMIN, // <-- THIS IS THE FIX (was "admin")
      },
    });

    if (!adminMembership) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    // 2. Find and complete the current active cycle
    const activeCycle = await prisma.cycle.findFirst({
      where: { groupId: groupId, status: "active" },
      orderBy: { startDate: "desc" },
    });

    if (activeCycle) {
      await prisma.cycle.update({
        where: { id: activeCycle.id },
        data: { status: "completed" },
      });
    }

    // 3. Create the new cycle (e.g., for the next month)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await prisma.cycle.create({
      data: {
        groupId: groupId,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        updatedAt: new Date(),
      },
    });

    // 4. Log this action in the group's activity feed
    await logActivity(
      groupId,
      session.user.id,
      'cycle_started',
      `${session.user.name} started a new cycle.`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[START_NEW_CYCLE_ERROR]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}