import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");
  const cursor = searchParams.get("cursor"); // minPoints

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

  // 2️⃣ user claimed rewards
  const userRewards = await prisma.userMakeoverSelfReward.findMany({
    where: {
      userId: session.user.id,
      programId,
    },
    select: {
      checkpointId: true,
      completedAt: true,
    },
  });

  const rewardMap = new Map(
    userRewards.map(r => [r.checkpointId, !!r.completedAt])
  );

  // 3️⃣ checkpoints + group
  const checkpoints = await prisma.makeoverSelfRewardCheckpoint.findMany({
    where: cursor ? { minPoints: { gt: Number(cursor) } } : undefined,
    orderBy: { minPoints: "asc" },
    take: PAGE_SIZE,
    include: {
      rewardLibrary: {
        select: {
          title: true,
          description: true,
        },
      },
    },
  });
  // ok from this 

  const items = checkpoints.map(cp => {
    let status: "locked" | "unlocked" | "completed" = "locked";
    let canEdit = false;

    if (rewardMap.get(cp.id)) {
      status = "completed";
    } else if (cp.minPoints <= totalPoints) {
      status = "unlocked";
    } else {
      status = "locked";
      canEdit = true; // 👈 ONLY locked rewards editable
    }

    return {
      checkpointId: cp.id,
      minPoints: cp.minPoints,
      groupTitle: cp.rewardLibrary.title,
      groupDescription: cp.rewardLibrary.description,
      status,
      canEdit,
    };
  });

  return NextResponse.json({
    items,
    nextCursor:
      checkpoints.length === PAGE_SIZE
        ? checkpoints[checkpoints.length - 1].minPoints
        : null,
  });
}
