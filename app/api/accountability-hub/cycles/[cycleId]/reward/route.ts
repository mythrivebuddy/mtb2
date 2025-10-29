import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityType } from "@prisma/client";
import { assignJp, deductJp } from "@/lib/utils/jp";

// const REWARD_AMOUNT = 100; // --- REMOVED: This now comes from the client

export async function POST(
  req: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminId = session.user.id;
    const { cycleId } = await params;

    // --- MODIFIED: Destructure 'amount' from the request body ---
    const { memberIds, amount } = (await req.json()) as {
      memberIds: string[];
      amount: number;
    };

    if (!memberIds?.length)
      return NextResponse.json(
        { error: "No members provided" },
        { status: 400 }
      );

    // --- ADDED: Validate the 'amount' from the client ---
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid reward amount. Must be a positive number." },
        { status: 400 }
      );
    }
    
    // Use the validated amount.
    const rewardPerMember = Math.ceil(amount);

    // 1. Fetch all required data...
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { plan: true },
    });

    if (!admin)
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: { group: true },
    });

    if (!cycle)
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      include: { plan: true },
    });

    if (members.length !== memberIds.length) {
      return NextResponse.json(
        { error: "One or more member IDs are invalid" },
        { status: 404 }
      );
    }

    // 2. Define cost based on the dynamic amount
    // --- MODIFIED: Use rewardPerMember ---
    const totalBaseAmount = rewardPerMember * memberIds.length;

    // 3. Execute the transaction
    const rewards = await prisma.$transaction(async (tx) => {
      // a. Deduct the *total* cost from the admin
      await deductJp(
        admin,
        ActivityType.COACH_REWARD_SPEND,
        tx,
        { amount: totalBaseAmount } // This uses the calculated total
      );

      // b. Assign the reward to each member
      const memberAssignments = members.map((member) =>
        assignJp(
          member,
          ActivityType.COACH_REWARD_RECEIVE,
          tx,
          { amount: rewardPerMember } // --- MODIFIED: Use rewardPerMember ---
        )
      );
      await Promise.all(memberAssignments);

      // c. Create the 'Reward' log records
      const rewardCreations = memberIds.map((memberId: string) =>
        tx.reward.create({
          data: {
            jpAmount: rewardPerMember, // --- MODIFIED: Use rewardPerMember ---
            adminId: adminId,
            memberId,
            cycleId,
            notes: `Cycle reward from ${cycle.group.name}`,
          },
        })
      );

      return await Promise.all(rewardCreations);
    });

    // 4. If transaction is successful, return success
    return NextResponse.json({
      message: `Rewarded ${rewards.length} member(s) successfully!`,
    });
  } catch (err) {
    console.error("REWARD ERROR", err);

    if (err instanceof Error && err.message === "Insufficient JP balance") {
      return NextResponse.json(
        { error: "Insufficient JP balance to give this reward." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send rewards" },
      { status: 500 }
    );
  }
}