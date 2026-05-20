import { prisma } from "@/lib/prisma";
import { awardLevelBadge } from "./awardLevelBadge";
import { NotificationType } from "@prisma/client";
import { safeInngestSend } from "../../inngest/utils";

export async function evaluateLevel(
  userId: string,
  programId: string,
  globalPoints: number,
) {
  // Find eligible level
  const targetLevel = await prisma.makeoverLevel.findFirst({
    where: { minPoints: { lte: globalPoints } },
    orderBy: { minPoints: "desc" },
  });

  if (!targetLevel) return;

  const current = await prisma.userMakeoverLevel.findUnique({
    where: { userId_programId: { userId, programId } },
  });

  // 🛑 GUARD: no downgrade or duplicate
  if (current && current.levelId >= targetLevel.id) return;

  // Upgrade
  await prisma.userMakeoverLevel.upsert({
    where: { userId_programId: { userId, programId } },
    update: { levelId: targetLevel.id },
    create: {
      userId,
      programId,
      levelId: targetLevel.id,
    },
  });

  // Award level badge
  await awardLevelBadge(userId, programId, targetLevel.name);

  safeInngestSend({
    name: "notification/send",
    data: {
      types: [NotificationType.CMP_LEVEL_UP],
      actorId: userId,

      context: {
        levelNumber: targetLevel.id,
        levelName: targetLevel.name,
        programId,
      },

      sendToUser: true,
      sendToAdmin: false,
      sendToCoach: false,
    },
  });
}
