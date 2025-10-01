// app/api/accountability-hub/cycles/[cycleId]/reward/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// Define a constant for the reward amount
const REWARD_AMOUNT = 100; // e.g., 100 JoyPearls per member

export async function POST(
  req: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cycleId } = params;
    const { memberIds } = await req.json(); // Expect an array of GroupMember IDs

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Member IDs are required" }, { status: 400 });
    }

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: { group: true },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // 1. Verify the current user is the admin of this group
    if (cycle.group.coachId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    // 2. Fetch the full member records to get their user IDs
    const membersToReward = await prisma.groupMember.findMany({
      where: {
        id: { in: memberIds },
        groupId: cycle.groupId,
      },
      include: { user: { select: { name: true } } },
    });

    const totalCost = membersToReward.length * REWARD_AMOUNT;

    // 3. Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // a. Check if admin has enough JoyPearls
      const admin = await tx.user.findUnique({
        where: { id: session.user.id },
      });
      if (!admin || admin.jpBalance < totalCost) {
        throw new Error("Insufficient JoyPearl balance.");
      }

      // b. Deduct JoyPearls from admin
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          jpBalance: { decrement: totalCost },
          jpSpent: { increment: totalCost },
        },
      });

      // c. Add JoyPearls to each rewarded member
      for (const member of membersToReward) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            jpBalance: { increment: REWARD_AMOUNT },
            jpEarned: { increment: REWARD_AMOUNT },
          },
        });

        // d. Create a Reward record for logging
        await tx.reward.create({
            data: {
                adminId: session.user.id,
                memberId: member.userId,
                cycleId: cycleId,
                amount: REWARD_AMOUNT,
            }
        });
      }
    });
    
    // 4. Log this activity after the transaction is successful
    const memberNames = membersToReward.map(m => m.user.name).join(', ');
    await logActivity(
        cycle.groupId,
        'status_updated', // Using 'result' icon
        `${session.user.name} rewarded ${memberNames} with ${REWARD_AMOUNT} JoyPearls.`
    );

    return NextResponse.json({ success: true, message: `${membersToReward.length} members rewarded.` });
  } catch (error) {
    console.error(`[REWARD_CYCLE_ERROR]`, error);
    return NextResponse.json({ error: (error as Error).message || "Something went wrong" }, { status: 500 });
  }
}