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

export async function assignJp(
  user: UserWithPlan,
  activity: ActivityType,
  prismaClient:
    | Prisma.TransactionClient
    | PrismaClient = prisma,
  options?: { amount?: number } // Optional parameter for dynamic amounts
) {
  try {
    // 1. Fetch the activity data to get its ID for logging the transaction.
    const activityData = await prismaClient.activity.findUnique({
      where: { activity },
    });

    if (!activityData) {
      throw new Error(`Activity '${activity}' not found in the database.`);
    }

    // 2. Determine the base amount to add.
    // If a dynamic amount is provided in options, use it.
    // Otherwise, fall back to the default amount from the database.
    const baseAmount = options?.amount ?? activityData.jpAmount;

    // 3. Calculate the final amount to add after applying any plan multipliers.
    const isActive = isPlanActive(user);
    const multiplier = isActive ? user?.plan?.jpMultiplier || 1 : 1;
    const jpToAdd = Math.ceil(baseAmount * multiplier);

    // 4. Update the user's JP balance and create a transaction record.
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        jpEarned: { increment: jpToAdd },
        jpBalance: { increment: jpToAdd },
        jpTransaction: { increment: jpToAdd }, // Assuming this tracks total transaction volume
        transaction: {
          create: {
            activityId: activityData.id,
            jpAmount: jpToAdd,
          },
        },
      },
    });

    // 5. Create a notification for the user about the earned JP.
    await createJPEarnedNotification(user.id, jpToAdd, activityData.activity);
  } catch (error) {
    // Log the error and re-throw it to be handled by the calling function.
    console.error(`Error in assignJp for activity ${activity}:`, error);
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
    | PrismaClient = prisma,
  options?: { amount?: number } // Optional parameter for dynamic amounts
) {
  try {
    // 1. Fetch the activity data to get its ID for logging the transaction.
    const activityData = await prismaClient.activity.findUnique({
      where: { activity: activity },
    });

    if (!activityData) {
      throw new Error(`Activity '${activity}' not found in the database.`);
    }

    // 2. Determine the base amount to deduct.
    // If a dynamic amount is provided in options, use it.
    // Otherwise, fall back to the default amount from the database.
    const baseAmount = options?.amount ?? activityData.jpAmount;

    // 3. Calculate the final amount to deduct after applying any discounts.
    const isActive = isPlanActive(user);
    const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
    const jpToDeduct = Math.ceil(baseAmount * (1 - discount / 100));

    // 4. Check if the user has a sufficient balance.
    if (user.jpBalance < jpToDeduct) {
      throw new Error("Insufficient JP balance");
    }

    // 5. Update the user's JP balance and create a transaction record.
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        jpSpent: { increment: jpToDeduct },
        jpBalance: { decrement: jpToDeduct },
        jpTransaction: { increment: jpToDeduct }, // Assuming this tracks total transaction volume
        transaction: {
          create: {
            activityId: activityData.id,
            jpAmount: jpToDeduct,
          },
        },
      },
    });

    // 6. Create a notification for the user about the spent JP.
    await createJpSpentNotification(user.id, jpToDeduct, activityData.activity);
  } catch (error) {
    // Log the error and re-throw it to be handled by the calling function (e.g., the API route)
    console.error(`Error in deductJp for activity ${activity}:`, error);
    throw error;
  }
}
// Helper to calculate JP to deduct
export function getJpToDeduct(user: UserWithPlan, activityData: Activity) {
  const isActive = isPlanActive(user);
  const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
  return Math.ceil(activityData.jpAmount * (1 - discount / 100));
}
