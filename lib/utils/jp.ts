// lib/utils/jp.ts

// function to add jp according to the plan and activity

import { Activity, ActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createJPEarnedNotification,
  createJpSpentNotification,
} from "./notifications";

type UserWithPlan = Prisma.UserGetPayload<{
  include: { plan: true };
  omit: { password: true };
}>;

export function isPlanActive(user: UserWithPlan) {
  if (!user.planId) return false; // Free user → Not active
  if (!user.planEnd) return true; // Lifetime plan → Always active
  return new Date() < user.planEnd; // Valid time-based plan
}

export async function assignJp(user: UserWithPlan, activity: ActivityType) {
  try {
    const activityData = await prisma.activity.findUnique({
      where: { activity },
    });
    if (!activityData) {
      throw new Error(`Activity ${activity} not found`);
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
            jpAmount: jpToAdd,
          },
        },
      },
    });
    await createJPEarnedNotification(user.id, jpToAdd, activityData.activity);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// --- MODIFIED FUNCTION ---
// Added an optional 'prismaClient' parameter to support transactions.
export async function deductJp(
  user: UserWithPlan,
  activity: ActivityType,
  prismaClient:
    | Prisma.TransactionClient
    | PrismaClient = prisma /* Default to global prisma instance */
) {
  try {
    const activityData = await prismaClient.activity.findUnique({
      where: { activity: activity },
    });
    if (!activityData) {
      throw new Error(`Activity ${activity} not found`);
    }

    const isActive = isPlanActive(user);
    const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
    const jpToDeduct = Math.ceil(activityData.jpAmount! * (1 - discount / 100));

    if (user.jpBalance < jpToDeduct) {
      // This specific error message will be caught in the API route.
      throw new Error("Insufficient JP balance");
    }

    // Use the passed prismaClient for the update operation.
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        jpSpent: { increment: jpToDeduct },
        jpBalance: { decrement: jpToDeduct },
        jpTransaction: { increment: jpToDeduct },
        transaction: {
          create: {
            activityId: activityData.id!,
            jpAmount: jpToDeduct,
          },
        },
      },
    });
    await createJpSpentNotification(user.id, jpToDeduct, activityData.activity);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Helper to calculate JP to deduct
export function getJpToDeduct(user: UserWithPlan, activityData: Activity) {
  const isActive = isPlanActive(user);
  const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
  return Math.ceil(activityData.jpAmount * (1 - discount / 100));
}
