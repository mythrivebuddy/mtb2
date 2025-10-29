// app/api/accountability-hub/groups/[groupId]/cycles/route.ts
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

    const { groupId } = await params;

    // 1. Verify the user is an admin of this group
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
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

    // 2. Define the new cycle dates
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // 3. Find the current active cycle
    const activeCycle = await prisma.cycle.findFirst({
      where: { groupId: groupId, status: "active" },
      orderBy: { startDate: "desc" },
    });

    if (activeCycle) {
      // --- MODIFIED: Instead of completing, UPDATE the existing cycle ---
      await prisma.cycle.update({
        where: { id: activeCycle.id },
        data: {
          startDate: startDate,
          endDate: endDate,
          status: "active", // Ensure status remains active
          updatedAt: new Date(),
        },
      });
    } else {
      // --- FALLBACK: If no active cycle exists, create one ---
      // (This is the same logic as your original 'prisma.cycle.create')
      await prisma.cycle.create({
        data: {
          groupId: groupId,
          startDate: startDate,
          endDate: endDate,
          status: "active",
          updatedAt: new Date(),
        },
      });
    }

    // 4. Log this action
    await logActivity(
      groupId,
      session.user.id,
      "cycle_started",
      `${session.user.name} started a new cycle.` // This log message still works
    );

    return NextResponse.json(
      { message: "New cycle started successfully", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[START_NEW_CYCLE_ERROR]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}