import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";

type InactivityConfig = {
  days: number;
  notifiedField: "inactivity3DayNotified" | "inactivity7DayNotified";
  type: NotificationType;
};

export async function runInactivityNotifier({
  days,
  notifiedField,
  type,
}: InactivityConfig) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ----------------------------------------------------
     1️⃣ Fetch states
  ---------------------------------------------------- */
  const states = await prisma.userProgramState.findMany({
    where: { onboarded: true },
    select: {
      userId: true,
      programId: true,
      inactivity3DayNotified: true,
      inactivity7DayNotified: true,
    },
  });

  if (!states.length) {
    return { inactiveCount: 0, notified: 0 };
  }

  /* ----------------------------------------------------
     2️⃣ Fetch last activity (batched)
  ---------------------------------------------------- */
  const lastActivities = await prisma.makeoverPointsSummary.findMany({
    select: {
      userId: true,
      programId: true,
      lastUpdated: true,
    },
    distinct: ["userId", "programId"],
  });

  const lastActivityMap = new Map(
    lastActivities.map((a) => [
      `${a.userId}_${a.programId}`,
      a.lastUpdated,
    ])
  );

  /* ----------------------------------------------------
     3️⃣ Compute eligible users
  ---------------------------------------------------- */
  const toNotify: { userId: string; programId: string }[] = [];

  for (const state of states) {
    const key = `${state.userId}_${state.programId}`;
    const lastActiveAt = lastActivityMap.get(key);

    const lastNotified = state[notifiedField];
    const referenceDate = lastNotified ?? lastActiveAt;

    if (!referenceDate) continue;

    const refDate = new Date(referenceDate);
    refDate.setHours(0, 0, 0, 0);

    const diffDays =
      (today.getTime() - refDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays >= days) {
      toNotify.push({
        userId: state.userId,
        programId: state.programId,
      });
    }
  }

  if (!toNotify.length) {
    return { inactiveCount: 0, notified: 0 };
  }

  /* ----------------------------------------------------
     4️⃣ Unique users
  ---------------------------------------------------- */
  const userIds = [...new Set(toNotify.map((u) => u.userId))];

  /* ----------------------------------------------------
     5️⃣ ✅ DB-driven bulk notification
  ---------------------------------------------------- */
  await sendDbPushNotificationMultipleUsers({
    type,
    userIds,
    context: {
      count: toNotify.length, // optional dynamic usage
    },
  });

  /* ----------------------------------------------------
     6️⃣ Update notified flags
  ---------------------------------------------------- */
  await prisma.userProgramState.updateMany({
    where: {
      OR: toNotify.map((u) => ({
        userId: u.userId,
        programId: u.programId,
      })),
    },
    data: {
      [notifiedField]: today,
      lastReminderDate: today,
    },
  });

  return {
    inactiveCount: toNotify.length,
    notified: userIds.length,
    userIds,
  };
}