// /api/makeover-program/makeover-self-rewards/user-selection
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    programId,
    checkpointId,
    rewardOptionId,
    // isCustom,
    customTitle,
    customDescription,
  } = await req.json();

  if (!programId || !checkpointId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const resolvedIsCustom = !rewardOptionId;

  // 1️⃣ checkpoint
  const checkpoint = await prisma.makeoverSelfRewardCheckpoint.findUnique({
    where: { id: checkpointId },
    include: { rewardLibrary: true },
  });

  if (!checkpoint) {
    return NextResponse.json({ error: "Invalid checkpoint" }, { status: 400 });
  }

  // 2️⃣ prevent re-claim
  const existing = await prisma.userMakeoverSelfReward.findFirst({
    where: {
      userId: session.user.id,
      programId,
      checkpointId,
      completedAt: { not: null }, // ✅ ONLY BLOCK IF ACTUALLY CLAIMED
    },
  });


  if (existing) {
    return NextResponse.json(
      { error: "Reward already claimed" },
      { status: 400 }
    );
  }

  // 3️⃣ validate option
  if (!resolvedIsCustom && rewardOptionId) {
    const option = await prisma.makeoverSelfRewardOption.findUnique({
      where: { id: rewardOptionId },
    });

    if (!option || option.libraryId !== checkpoint.rewardLibraryId) {
      return NextResponse.json({ error: "Invalid reward option" }, { status: 400 });
    }
  }

  // 4️⃣ create reward (CLAIM)
  const reward = await prisma.userMakeoverSelfReward.upsert({
    where: {
      userId_programId_checkpointId: {
        userId: session.user.id,
        programId,
        checkpointId,
      },
    },
    update: {
      rewardOptionId: resolvedIsCustom ? null : rewardOptionId,
      isCustom: resolvedIsCustom,

      customTitle: resolvedIsCustom ? customTitle : null,
      customDescription: resolvedIsCustom ? customDescription : null,

      completedAt: new Date(), // ✅ CLAIM happens here
    },
    create: {
      userId: session.user.id,
      programId,

      levelId: checkpoint.levelId,
      levelName: checkpoint.rewardLibrary.levelName,

      checkpointId,

      rewardOptionId: resolvedIsCustom ? null : rewardOptionId,
      isCustom: resolvedIsCustom,

      customTitle: resolvedIsCustom ? customTitle : null,
      customDescription: resolvedIsCustom ? customDescription : null,

      pointsAtUnlock: checkpoint.minPoints,
      completedAt: new Date(),
    },
  });


  return NextResponse.json(reward);
}
