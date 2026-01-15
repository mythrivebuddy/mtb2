import { prisma } from "@/lib/prisma";

export async function awardMilestoneBadges(
  userId: string,
  programId: string,
  globalPoints: number
) {
  const eligibleBadges = await prisma.makeoverBadge.findMany({
    where: {
      type: "MILESTONE",
      thresholdPoints: { lte: globalPoints },
    },
  });

  for (const badge of eligibleBadges) {
    // 🛑 DB-level idempotency
    await prisma.userMakeoverBadge.upsert({
      where: {
        userId_programId_badgeId: {
          userId,
          programId,
          badgeId: badge.id,
        },
      },
      update: {},
      create: {
        userId,
        programId,
        badgeId: badge.id,
      },
    });
  }
}
