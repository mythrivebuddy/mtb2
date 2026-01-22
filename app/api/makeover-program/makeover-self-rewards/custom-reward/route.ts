import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    programId,
    checkpointId,
    customTitle,
    customDescription,
  } = await req.json();

  if (!programId || !checkpointId || !customTitle) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const checkpoint = await prisma.makeoverSelfRewardCheckpoint.findUnique({
    where: { id: checkpointId },
    include: { rewardLibrary: true },
  });

  if (!checkpoint) {
    return NextResponse.json(
      { error: "Invalid checkpoint" },
      { status: 400 }
    );
  }

  const reward = await prisma.userMakeoverSelfReward.upsert({
    where: {
      userId_programId_checkpointId: {
        userId: session.user.id,
        programId,
        checkpointId,
      },
    },
    update: {
      isCustom: true,
      rewardOptionId: null,
      customTitle,
      customDescription,
      // ❌ DO NOT TOUCH completedAt
    },
    create: {
      userId: session.user.id,
      programId,

      levelId: checkpoint.levelId,
      levelName: checkpoint.rewardLibrary.levelName,

      checkpointId,
      rewardOptionId: null,
      isCustom: true,

      customTitle,
      customDescription,

      pointsAtUnlock: checkpoint.minPoints,
      // ❌ DO NOT SET completedAt
    },
  });

  return NextResponse.json(reward);
}

