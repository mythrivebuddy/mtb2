// file: /lib/utils/assignJpWithoutPlan.ts
export {};
import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

type PrismaTx = Prisma.TransactionClient | PrismaClient;

export type AssignJpResult = {
  jpAdded: number;
  activity: ActivityType;
};

export async function assignJpWithoutPlan(
  userId: string,
  activity: ActivityType,
  prismaClient: PrismaTx = prisma
): Promise<AssignJpResult> {
  const activityData = await prismaClient.activity.findUnique({
    where: { activity },
  });

  if (!activityData) {
    throw new Error(`Activity '${activity}' not found`);
  }

  const jpToAdd = activityData.jpAmount;

  await prismaClient.user.update({
    where: { id: userId },
    data: {
      jpEarned: { increment: jpToAdd },
      jpBalance: { increment: jpToAdd },
      jpTransaction: { increment: jpToAdd },
      transaction: {
        create: {
          activityId: activityData.id,
          jpAmount: jpToAdd,
        },
      },
    },
  });

  return {
    jpAdded: jpToAdd,
    activity: activityData.activity,
  };
}
