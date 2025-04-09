// function to add jp according to the plan and activity

import { ActivityType, Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UserWithPlan = Prisma.UserGetPayload<{
  include: { plan: true };
}>;

function isPlanActive(user: UserWithPlan) {
  if (!user.planStart || !user.planEnd) return false;
  const now = new Date();
  return now >= user.planStart && now <= user.planEnd;
}

export async function assignJp(user: UserWithPlan, activity: ActivityType) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activityData = await prisma.activity.findUnique({
      where: { activity: activity },
    });
    if (!activityData) {
      throw new Error(`Activity ${activity} not found`);
    }

    // Check daily JP limit
    const transactionsToday = await prisma.transaction.count({
      where: {
        userId: user.id,
        activityId: activityData.id,
        createdAt: {
          gte: today
        }
      }
    });

    const totalJpToday = transactionsToday * activityData.jpAmount;
    
    // If we've hit the daily limit, don't award any more JP
    if (totalJpToday >= 150) {
      throw new Error("Daily JP limit reached");
    }

    const isActive = isPlanActive(user);
    const multiplier = isActive ? user?.plan?.jpMultiplier || 1 : 1;
    const jpToAdd = activityData.jpAmount! * multiplier;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        jpEarned: { increment: jpToAdd },
        jpBalance: { increment: jpToAdd },
        jpTransaction: { increment: jpToAdd },
        transaction: {
          create: {
            activityId: activityData.id!,
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deductJp(user: UserWithPlan, activity: ActivityType) {
  try {
    const activityData = await prisma.activity.findUnique({
      where: { activity: activity },
    });
    if (!activityData) {
      throw new Error(`Activity ${activity} not found`);
    }

    const isActive = isPlanActive(user);
    const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
    const jpToDeduct = Math.ceil(activityData.jpAmount! * (1 - discount / 100));

    if (user.jpBalance < jpToDeduct) {
      throw new Error("Insufficient JP balance");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        jpSpent: { increment: jpToDeduct },
        jpBalance: { decrement: jpToDeduct },
        jpTransaction: { increment: jpToDeduct },
        transaction: {
          create: {
            //!may need user ID here -- may be
            activityId: activityData.id!,
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
