import { prisma } from "@/lib/prisma";

export async function awardLevelBadge(
  userId: string,
  programId: string,
  levelName: string
) {
  const badge = await prisma.makeoverBadge.findFirst({
    where: {
      type: "LEVEL",
      name: `${levelName} Badge`,
    },
  });

  if (!badge) return;

  // 🛑 DB guard via unique constraint
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
