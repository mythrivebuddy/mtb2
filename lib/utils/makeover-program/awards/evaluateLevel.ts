import { prisma } from "@/lib/prisma";
import { awardLevelBadge } from "./awardLevelBadge";
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { sendPushNotificationToUser } from "../../pushNotifications";
import { NotificationType } from "@prisma/client";
import { getCMPNotification } from "../getNotificationTemplate";

export async function evaluateLevel(
  userId: string,
  programId: string,
  globalPoints: number
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


  const notification = await getCMPNotification(
    NotificationType.CMP_LEVEL_UP
  );
  const { title, description, url } = notification || CMP_NOTIFICATIONS.LEVEL_UP;

  const dynamicTitle = title
    .replace("{{levelNumber}}", String(targetLevel.id))
    .replace("{{levelName}}", targetLevel.name);
  void sendPushNotificationToUser(userId, dynamicTitle, description, { url });
}
