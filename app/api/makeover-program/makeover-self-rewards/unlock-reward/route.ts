import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { CMP_NOTIFICATIONS } from "@/lib/constant";

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
    where: { userId: session.user.id, programId },
    _sum: { totalPoints: true },
  });

  const totalPoints = pointsAgg._sum.totalPoints ?? 0;

  // 2️⃣ checkpoints that SHOULD be unlocked
  const checkpoints = await prisma.makeoverSelfRewardCheckpoint.findMany({
    where: {
      minPoints: { lte: totalPoints },
    },
    include: {
      rewardLibrary: true,
      userRewards: {
        where: {
          userId: session.user.id,
          programId,
        },
        select: { id: true },
      },
    },
  });

  // 3️⃣ newly unlocked = no row exists yet
  const newlyUnlocked = checkpoints.filter(
    cp => cp.userRewards.length === 0
  );

  if (newlyUnlocked.length === 0) {
    return NextResponse.json({ unlocked: 0 });
  }

  // 4️⃣ create unlock records (GUARD)
  await prisma.userMakeoverSelfReward.createMany({
    data: newlyUnlocked.map(cp => ({
      userId: session.user.id,
      programId,

      levelId: cp.levelId,
      levelName: cp.rewardLibrary.levelName,

      checkpointId: cp.id,
      pointsAtUnlock: cp.minPoints,
      completedAt: null,
    })),
    skipDuplicates: true,
  });

  // 5️⃣ notify (fire & forget)
  const { title, description, url } = CMP_NOTIFICATIONS.REWARD_UNLOCKED;

 newlyUnlocked.forEach(() => {
  void sendPushNotificationToUser(
    session.user.id,
    title,
    description,
    { url }
  );
});


  return NextResponse.json({
    unlocked: newlyUnlocked.length,
  });
}
