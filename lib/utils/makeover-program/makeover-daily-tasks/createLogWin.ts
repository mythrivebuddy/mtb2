// file: /lib/utils/makeover-program/makeover-daily-tasks/createLogWin.ts
import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  StreakType,
  ProgressVault,
  Prisma,
} from "@prisma/client";
import { startOfDay, addDays } from "date-fns";

import { createJPEarnedNotification } from "@/lib/utils/notifications";
import { AssignJpResult, assignJpWithoutPlan } from "@/lib/utils/assignJpWithoutPlan";

/* ---------------------------------- */
/* Types                              */
/* ---------------------------------- */

export type CreateLogWinParams = {
  userId: string;
  content: string;
  activityType?: ActivityType;
  streakType?: StreakType;
  dailyLimit?: number;
};

export type CreateLogWinResult = {
  log: ProgressVault;
  warning?: string;
};

type PrismaTx = Prisma.TransactionClient;

type NotificationPayload = {
  userId: string;
  jp: number;
  activity: ActivityType;
};

type TransactionResult = {
  log: ProgressVault;
  warning?: string;
  notification?: NotificationPayload;
};

/* ---------------------------------- */
/* Constants                          */
/* ---------------------------------- */

const STREAK_REWARDS: Record<number, ActivityType> = {
  7: ActivityType.PROGRESS_VAULT_STREAK_REWARD_7_DAYS,
  21: ActivityType.PROGRESS_VAULT_STREAK_REWARD_21_DAYS,
  45: ActivityType.PROGRESS_VAULT_STREAK_REWARD_45_DAYS,
  90: ActivityType.PROGRESS_VAULT_STREAK_REWARD_90_DAYS,
};

/* ---------------------------------- */
/* Main Service                       */
/* ---------------------------------- */

export async function createLogWin({
  userId,
  content,
  activityType = ActivityType.PROGRESS_VAULT,
  streakType = StreakType.PROGRESS_VAULT,
  dailyLimit = 3,
}: CreateLogWinParams): Promise<CreateLogWinResult> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const txResult: TransactionResult =
    await prisma.$transaction(async (tx: PrismaTx) => {
      const [activeLogsToday, jpLogsToday] = await Promise.all([
        tx.progressVault.count({
          where: {
            userId,
            deletedAt: null,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        tx.progressVault.count({
          where: {
            userId,
            jpPointsAssigned: true,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
      ]);

      if (activeLogsToday >= dailyLimit) {
        throw new Error("DAILY_LOG_LIMIT_REACHED");
      }

      const log = await tx.progressVault.create({
        data: {
          userId,
          content,
        },
      });

      let warning: string | undefined;
      let notification: NotificationPayload | undefined;

      // JP only once per day
      if (jpLogsToday === 0) {
        const jpResult: AssignJpResult =
          await assignJpWithoutPlan(
            userId,
            activityType,
            tx
          );

        notification = {
          userId,
          jp: jpResult.jpAdded,
          activity: jpResult.activity,
        };

        await tx.progressVault.update({
          where: { id: log.id },
          data: { jpPointsAssigned: true },
        });
      } else {
        warning = "Daily JP already awarded.";
      }

      // Streak only on first log
      if (activeLogsToday === 0) {
        await handleStreak(tx, userId, today, streakType);
      }

      return { log, warning, notification };
    });

  // 🔔 SAFE: outside transaction
  if (txResult.notification) {
    await createJPEarnedNotification(
      txResult.notification.userId,
      txResult.notification.jp,
      txResult.notification.activity
    );
  }

  return {
    log: txResult.log,
    warning: txResult.warning,
  };
}

/* ---------------------------------- */
/* Streak Logic                       */
/* ---------------------------------- */

async function handleStreak(
  tx: PrismaTx,
  userId: string,
  today: Date,
  streakType: StreakType
): Promise<void> {
  const streak = await tx.streak.findUnique({
    where: {
      userId_type: { userId, type: streakType },
    },
  });

  if (!streak) {
    await createOrResetStreak(tx, userId, today, streakType, 1);
    return;
  }

  const lastDay = startOfDay(new Date(streak.progress_vault_last_at!));
  const dayDiff =
    (today.getTime() - lastDay.getTime()) / 86_400_000;

  if (dayDiff > 1) {
    await createOrResetStreak(tx, userId, today, streakType, 1);
    return;
  }

  if (dayDiff === 1) {
    const newCount = streak.progress_vault_count + 1;

    await tx.streak.update({
      where: {
        userId_type: { userId, type: streakType },
      },
      data: {
        progress_vault_count: newCount,
        progress_vault_last_at: today,
      },
    });

    await tx.streakHistory.create({
      data: {
        userId,
        type: streakType,
        count: newCount,
        date: today,
      },
    });

    const reward = STREAK_REWARDS[newCount];
    if (reward) {
      const jpResult = await assignJpWithoutPlan(
        userId,
        reward,
        tx
      );

      await createJPEarnedNotification(
        userId,
        jpResult.jpAdded,
        jpResult.activity
      );
    }
  }
}

/* ---------------------------------- */
/* Streak Creator / Reset             */
/* ---------------------------------- */

async function createOrResetStreak(
  tx: PrismaTx,
  userId: string,
  today: Date,
  type: StreakType,
  count: number
): Promise<void> {
  await tx.streak.upsert({
    where: {
      userId_type: { userId, type },
    },
    update: {
      progress_vault_count: count,
      progress_vault_last_at: today,
    },
    create: {
      userId,
      type,
      progress_vault_count: count,
      progress_vault_last_at: today,
    },
  });

  await tx.streakHistory.create({
    data: {
      userId,
      type,
      count,
      date: today,
    },
  });
}
