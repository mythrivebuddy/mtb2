import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json({ error: "programId required" }, { status: 400 });
  }

  // 1️⃣ total points
  const pointsAgg = await prisma.makeoverPointsSummary.aggregate({
    where: {
      userId: session.user.id,
      programId,
    },
    _sum: { totalPoints: true },
  });

  const totalPoints = pointsAgg._sum.totalPoints ?? 0;

  // 2️⃣ already claimed
  const claimed = await prisma.userMakeoverSelfReward.findMany({
    where: {
      userId: session.user.id,
      programId,
    },
    select: { checkpointId: true },
  });

  const claimedIds = claimed.map(c => c.checkpointId);

  // 3️⃣ unlocked + unclaimed checkpoints
  const checkpoints = await prisma.makeoverSelfRewardCheckpoint.findMany({
    where: {
      minPoints: { lte: totalPoints },
      id: { notIn: claimedIds },
    },
    orderBy: { minPoints: "asc" },
    include: {
      rewardLibrary: {
        include: {
          options: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    unlockableRewards: checkpoints.map(cp => ({
      checkpointId: cp.id,
      minPoints: cp.minPoints,
      groupTitle: cp.rewardLibrary.title,
      options: cp.rewardLibrary.options,
    })),
  });
}
