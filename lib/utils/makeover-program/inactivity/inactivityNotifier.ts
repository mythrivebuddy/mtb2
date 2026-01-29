import { prisma } from "@/lib/prisma";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";

type InactivityConfig = {
  days: number;
  notification: {
    title: string;
    description: string;
    url: string;
  };
  notifiedField: "inactivity3DayNotified" | "inactivity7DayNotified";
};

export async function runInactivityNotifier({
  days,
  notification,
  notifiedField,
}: InactivityConfig) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ----------------------------------------------------
     1️⃣ Fetch user-program states
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
     2️⃣ Fetch last activity
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
     3️⃣ Determine who needs notification
  ---------------------------------------------------- */
  const toNotify: { userId: string; programId: string }[] = [];

  for (const state of states) {
    const key = `${state.userId}_${state.programId}`;
    const lastActiveAt = lastActivityMap.get(key);

    const lastNotified = state[notifiedField];
    const referenceDate = lastNotified ?? lastActiveAt;

    if (!referenceDate) continue;

    // DAY-BASED comparison
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
     4️⃣ Send push
  ---------------------------------------------------- */
  const userIds = [...new Set(toNotify.map((u) => u.userId))];

  await sendPushNotificationMultipleUsers(
    userIds,
    notification.title,
    notification.description,
    { url: notification.url }
  );

  /* ----------------------------------------------------
     5️⃣ Update notified date
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
