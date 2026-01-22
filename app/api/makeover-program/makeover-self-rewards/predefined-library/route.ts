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

  // const rewardMap = new Map(
  //   userRewards.map(r => [r.checkpointId, !!r.completedAt])
  // );

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
          options: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      },
      userRewards: {
        where: {
          userId: session.user.id,
          programId,
        },
        select: {
          customTitle: true,
          customDescription: true,
          completedAt: true,
          isCustom: true,
        },
      },
    },
  });
  // ok from this 

  const items = checkpoints.map(cp => {

    const userReward = cp.userRewards[0];
    const isCustom = userReward?.isCustom === true;

    return {
      checkpointId: cp.id,
      minPoints: cp.minPoints,

      groupTitle: userReward?.customTitle ?? cp.rewardLibrary.title,
      groupDescription:
        userReward?.customDescription ?? cp.rewardLibrary.description,

      status: userReward?.completedAt
        ? "completed"
        : cp.minPoints <= totalPoints
          ? "unlocked"
          : "locked",

      canEdit: cp.minPoints > totalPoints,


      options: isCustom
        ? []
        : cp.rewardLibrary.options.map((opt) => ({
          id: opt.id,
          title: opt.title,
          description: opt.description,
        })),
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
