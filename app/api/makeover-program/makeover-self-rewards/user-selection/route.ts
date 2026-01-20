// app/api/self-rewards/select/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    programId,
    checkpointId,
    rewardId,
    isCustom,
    customTitle,
    customDescription,
  } = body;

  // 1️⃣ Get checkpoint
  const checkpoint = await prisma.makeoverSelfRewardCheckpoint.findUnique({
    where: { id: checkpointId },
  });

  if (!checkpoint) {
    return NextResponse.json({ error: "Invalid checkpoint" }, { status: 400 });
  }

  // 2️⃣ Get level snapshot
  const level = await prisma.makeoverLevel.findUnique({
    where: { id: checkpoint.levelId },
  });

  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 400 });
  }

  // 3️⃣ Create selection
  const reward = await prisma.userMakeoverSelfReward.create({
    data: {
      userId: session.user.id,
      programId,

      levelId: level.id,
      levelName: level.name,

      checkpointId,

      rewardId: isCustom ? null : rewardId,
      isCustom: !!isCustom,

      customTitle: isCustom ? customTitle : null,
      customDescription: isCustom ? customDescription : null,

      pointsAtUnlock: checkpoint.minPoints,
    },
  });

  return NextResponse.json(reward);
}
