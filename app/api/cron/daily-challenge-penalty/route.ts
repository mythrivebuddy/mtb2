// app/api/cron/daily-challenge-penalty/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deductJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";

const ADMIN_TIME = { hour: 19, minute: 30 }; // 7:30 PM LOCAL USER TIME

export async function GET() {
  try {
    const now = new Date();

    // ✅ FIX 1: Fetch ALL active enrollments (NO filtering by nextPenaltyAt)
    const enrollments = await prisma.challengeEnrollment.findMany({
      where: {
        status: "IN_PROGRESS",
        challenge: { status: "ACTIVE" },
      },
      include: {
        user: { include: { plan: true } },
        challenge: { select: { id: true, penalty: true } },
        userTasks: { select: { lastCompletedAt: true } },
      },
    });

    const userPenaltyMap = new Map<
      string,
      { total: number; breakdown: string[] }
    >();

    for (const enrollment of enrollments) {
      const { user, challenge, userTasks } = enrollment;
      if (!user || !challenge) continue;

      const timezone = user.timezone || "UTC";
      const userNow = toZonedTime(now, timezone);

      let shouldRunNow = false;
      let nextPenaltyAt = enrollment.nextPenaltyAt;

      // 🔥 STEP 1: Handle FIRST TIME (migration users)
      if (!nextPenaltyAt) {
        const target = new Date(userNow);
        target.setHours(ADMIN_TIME.hour, ADMIN_TIME.minute, 0, 0);

        if (userNow >= target) {
          shouldRunNow = true;
          target.setDate(target.getDate() + 1);
        }

        nextPenaltyAt = fromZonedTime(target, timezone);

        await prisma.challengeEnrollment.update({
          where: { id: enrollment.id },
          data: { nextPenaltyAt },
        });
      } else {
        // 🔥 STEP 2: Normal scheduled execution
        const userNowUTC = fromZonedTime(userNow, timezone);

        if (userNowUTC >= nextPenaltyAt) {
          shouldRunNow = true;
        }
      }

      if (!shouldRunNow) continue;

      // 🔥 STEP 3: Prevent duplicate same-day execution
      if (
        enrollment.lastPenaltyAt &&
        isSameDay(toZonedTime(enrollment.lastPenaltyAt, timezone), userNow)
      ) {
        continue;
      }

      // 🔥 STEP 4: Check if user completed ANY task today
      const startOfToday = new Date(userNow);
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      const completedToday = userTasks.some((task) => {
        if (!task.lastCompletedAt) return false;

        const taskTime = toZonedTime(task.lastCompletedAt, timezone);
        return taskTime >= startOfToday && taskTime < endOfToday;
      });
      console.log({
        userId: user.id,
        completedToday,
        tasks: userTasks.map((t) => t.lastCompletedAt),
      });

      // 🔥 STEP 5: Apply penalty if needed
      if (!completedToday && challenge.penalty > 0) {
        const result = await deductJp(
          user,
          ActivityType.CHALLENGE_PENALTY,
          prisma,
          {
            amount: challenge.penalty,
            metadata: {
              challengeId: challenge.id,
              reason: "Missed all tasks today",
            },
          },
        );

        const prev = userPenaltyMap.get(user.id) || {
          total: 0,
          breakdown: [],
        };

        prev.total += result.deductedAmount;
        prev.breakdown.push(
          `${result.deductedAmount} GP (${result.baseAmount} × ${result.multiplier})`,
        );

        userPenaltyMap.set(user.id, prev);
      }

      // 🔥 STEP 6: Schedule NEXT penalty (correct fix)
      const nextLocal = new Date(userNow);
      nextLocal.setDate(nextLocal.getDate() + 1);
      nextLocal.setHours(ADMIN_TIME.hour, ADMIN_TIME.minute, 0, 0);

      const next = fromZonedTime(nextLocal, timezone);

      await prisma.challengeEnrollment.update({
        where: { id: enrollment.id },
        data: {
          lastPenaltyAt: now,
          nextPenaltyAt: next,
        },
      });
    }

    // ✅ Notifications
    for (const [userId, data] of userPenaltyMap.entries()) {
      await sendPushNotificationFromDBToUser({
        type: "CHALLENGE_PENALTY",
        userId,
        context: {
          total: data.total,
          breakdown: data.breakdown.join(", "),
        },
      });
    }

    return NextResponse.json({
      success: true,
      processed: enrollments.length,
      penalizedUsers: userPenaltyMap.size,
    });
  } catch (error) {
    console.error("CRON ERROR:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
