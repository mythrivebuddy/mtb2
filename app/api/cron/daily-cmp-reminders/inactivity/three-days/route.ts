import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";

export const GET = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ----------------------------------------------------
       1️⃣ Fetch onboarded user-program states
    ---------------------------------------------------- */
    const states = await prisma.userProgramState.findMany({
      where: {
        onboarded: true,
      },
      select: {
        userId: true,
        programId: true,
        inactivity3DayNotified: true,
      },
    });

    if (!states.length) {
      return Response.json({ inactiveCount: 0, notified: 0 });
    }

    /* ----------------------------------------------------
       2️⃣ Fetch last activity per user-program
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
      lastActivities.map(
        (a) => [`${a.userId}_${a.programId}`, a.lastUpdated]
      )
    );

    /* ----------------------------------------------------
       3️⃣ Determine who needs notification
    ---------------------------------------------------- */
    const toNotify: { userId: string; programId: string }[] = [];

    for (const state of states) {
      const key = `${state.userId}_${state.programId}`;
      const lastActiveAt = lastActivityMap.get(key);

      const referenceDate = state.inactivity3DayNotified ?? lastActiveAt;
      if (!referenceDate) continue;

      const diffDays =
        (today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays >= 3) {
        toNotify.push({
          userId: state.userId,
          programId: state.programId,
        });
      }
    }

    if (!toNotify.length) {
      return Response.json({ inactiveCount: 0, notified: 0 });
    }

    /* ----------------------------------------------------
       4️⃣ Deduplicate users & send push
    ---------------------------------------------------- */
    const userIds = [...new Set(toNotify.map((u) => u.userId))];

    const { title, description, url } =
      CMP_NOTIFICATIONS.INACTIVITY_3_DAYS;

    await sendPushNotificationMultipleUsers(
      userIds,
      title,
      description,
      { url }
    );

    /* ----------------------------------------------------
       5️⃣ Update last notified date (rolling)
    ---------------------------------------------------- */
    await prisma.userProgramState.updateMany({
      where: {
        OR: toNotify.map((u) => ({
          userId: u.userId,
          programId: u.programId,
        })),
      },
      data: {
        inactivity3DayNotified: today,
        lastReminderDate: today,
      },
    });

    return Response.json({
      inactiveCount: toNotify.length,
      notified: userIds.length,
      userIds,
    });
  } catch (error) {
    console.error("INACTIVITY PUSH ERROR", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
