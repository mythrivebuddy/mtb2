import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// Define a constant for the reward amount for easy changes in the future
const REWARD_AMOUNT = 100; // e.g., 100 JoyPearls per member

export async function POST(
  req: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cycleId } = params;
    // ✅ FIX: The request body should contain the user IDs of the members to reward.
    const { userIdsToReward } = await req.json();

    if (!userIdsToReward || !Array.isArray(userIdsToReward) || userIdsToReward.length === 0) {
      return NextResponse.json({ error: "User IDs for reward are required" }, { status: 400 });
    }

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: { group: true },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // 1. Verify the current user is the admin (coach) of this group
    if (cycle.group.coachId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    // 2. Fetch the full GroupMember records to get their associated User IDs
    // ✅ FIX: The 'GroupMember' model does not have an 'id'. Filter by 'userId' instead.
    const membersToReward = await prisma.groupMember.findMany({
      where: {
        userId: { in: userIdsToReward },
        groupId: cycle.groupId,
      },
      include: { user: { select: { name: true } } },
    });

    // Verify that all requested user IDs are actual members of the group
    if (membersToReward.length !== userIdsToReward.length) {
      return NextResponse.json({ error: "One or more provided users are not members of this group." }, { status: 400 });
    }

    const totalCost = membersToReward.length * REWARD_AMOUNT;

    // 3. Use a database transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // a. Get the admin's current profile to check their balance
      const admin = await tx.user.findUnique({
        where: { id: session.user.id },
      });
      if (!admin || admin.jpBalance < totalCost) {
        throw new Error("Insufficient JoyPearl balance.");
      }

      // b. Deduct the total cost from the admin's balance
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          jpBalance: { decrement: totalCost },
          jpSpent: { increment: totalCost },
        },
      });

      // c. Loop through and credit JoyPearls to each rewarded member
      for (const member of membersToReward) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            jpBalance: { increment: REWARD_AMOUNT },
            jpEarned: { increment: REWARD_AMOUNT },
          },
        });

        // d. Create a Reward record for logging and history
        // ✅ FIX: This will work once you update your schema and run 'prisma generate'.
        await tx.reward.create({
          data: {
            adminId: session.user.id,
            memberId: member.userId,
            cycleId: cycleId,
            jpAmount: REWARD_AMOUNT,
          }
        });
      }
    });

    // 4. Log this action in the group's activity feed after the transaction succeeds
    // ✅ FIX (Automatic): 'm.user.name' now works because the query is valid.
    const memberNames = membersToReward.map(m => m.user.name).join(', ');
    await logActivity(
      cycle.groupId,
      session.user.id,
      'status_updated', // ✅ FIX: Corrected to match the expected 'logActivity' type.
      `${session.user.name} rewarded ${memberNames} with ${REWARD_AMOUNT} JoyPearls each.`
    );

    return NextResponse.json({ success: true, message: `${membersToReward.length} members have been rewarded.` });
  } catch (error) {
    console.error(`[REWARD_CYCLE_ERROR]`, error);
    return NextResponse.json({ error: (error as Error).message || "Something went wrong" }, { status: 500 });
  }
}
