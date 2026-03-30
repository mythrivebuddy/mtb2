// lib/utils/jp.ts

// function to add jp according to the plan and activity

import { Activity, ActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createJPEarnedNotification,
  createJpSpentNotification,
} from "./notifications";
import { checkFeature } from "../access-control/checkFeature";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

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
  prismaClient: Prisma.TransactionClient | PrismaClient = prisma,
  options?: { amount?: number; metadata?: Prisma.InputJsonValue }, // Optional parameter for dynamic amounts
) {
  try {
    // 1. Fetch the activity data to get its ID for logging the transaction.
    // const session = await getServerSession(authOptions);

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
    const joyPearlsConfig = await getJoyPearlsConfig(user);
    const multiplier = joyPearlsConfig?.earnRateMultiplier ?? 1;
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
            metadata: options?.metadata ?? undefined,
          },
        },
      },
    });

    // 5. Create a notification for the user about the earned JP.
    await createJPEarnedNotification(
      user.id,
      jpToAdd,
      activityData.activity,
      typeof options?.metadata === "object" && options.metadata !== null
        ? ((options.metadata as Record<string, unknown>).displayName as
            | string
            | undefined)
        : undefined,
    );
  } catch (error) {
    // Log the error and re-throw it to be handled by the calling function.
    console.error(`Error in assignGp for activity ${activity}:`, error);
    throw error;
  }
}
// --- MODIFIED FUNCTION ---
// Added an optional 'prismaClient' parameter to support transactions.
export async function deductJp(
  user: UserWithPlan,
  activity: ActivityType,
  prismaClient: Prisma.TransactionClient | PrismaClient = prisma,
  options?: { amount?: number; metadata?: Prisma.InputJsonValue }, // Optional parameter for dynamic amounts
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
    // const joyPearlsConfig = await getJoyPearlsConfig(user);
    let jpToDeduct = baseAmount;
    let spendMultiplier = 1;

    // Do NOT apply multiplier for store purchases
    if (activity !== "STORE_PURCHASE") {
      const joyPearlsConfig = await getJoyPearlsConfig(user);
      spendMultiplier = joyPearlsConfig?.spendRateMultiplier ?? 1;
      jpToDeduct = Math.ceil(baseAmount * spendMultiplier);
    }

    // 4. Check if the user has a sufficient balance.
    if (user.jpBalance < jpToDeduct) {
      throw new Error("Insufficient GP balance");
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
            metadata: options?.metadata ?? undefined,
          },
        },
      },
    });

    // 6. Create a notification for the user about the spent JP.

    await createJpSpentNotification(
      user.id,
      jpToDeduct,
      activityData.activity,
      typeof options?.metadata === "object" && options.metadata !== null
        ? ((options.metadata as Record<string, unknown>).displayName as
            | string
            | undefined)
        : undefined,
    );

    // ✅ RETURN BOTH VALUES
    return {
      deductedAmount: jpToDeduct,
      baseAmount,
      multiplier: spendMultiplier,
    };
  } catch (error) {
    // Log the error and re-throw it to be handled by the calling function (e.g., the API route)
    console.error(`Error in deductGp for activity ${activity}:`, error);
    throw error;
  }
}
// Helper to calculate JP to deduct
export function getJpToDeduct(user: UserWithPlan, activityData: Activity) {
  const isActive = isPlanActive(user);
  const discount = isActive ? user?.plan?.discountPercent || 0 : 0;
  return Math.ceil(activityData.jpAmount * (1 - discount / 100));
}

async function getJoyPearlsConfig(user: UserWithPlan) {
  const session = await getServerSession(authOptions);

  const result = checkFeature({
    feature: "joyPearls",
    user: session?.user ?? user, // Pass session user if available, otherwise fallback to provided user
  });

  if (!result.allowed) {
    return null;
  }

  return result.config as {
    earnRateMultiplier?: number;
    spendRateMultiplier?: number;
    bonusEligible?: boolean;
  };
}
