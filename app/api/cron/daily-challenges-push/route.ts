import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";
import { ChallengeJoinMode, CronKey } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { isSameDay } from "date-fns";
import { isAuthorized } from "@/lib/cron/auth";
import { getCronTime } from "@/lib/cron/getCronTime";

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const { hour, minute } = await getCronTime(
      CronKey.DAILY_CHALLENGE_REMINDER,
    );
    // ✅ Fetch enrollments
    const enrollments = await prisma.challengeEnrollment.findMany({
      where: {
        status: "IN_PROGRESS",
        challenge: {
          status: "ACTIVE",
          joinMode: ChallengeJoinMode.MANUAL,
        },
        user: {
          pushSubscriptions: {
            some: {},
          },
        },
      },
      select: {
        id: true,
        userId: true,
        challengeId: true,
        lastNotifiedAt: true,
        user: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        message: "No eligible users",
        total: 0,
        actualSent: 0,
      });
    }

    // ✅ Fetch today's completions
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const completions = await prisma.completionRecord.findMany({
      where: {
        status: "COMPLETED",
        date: todayUtc,
      },
      select: {
        userId: true,
        challengeId: true,
      },
    });

    const completionMap = new Map<string, Set<string>>();

    for (const c of completions) {
      if (!completionMap.has(c.userId)) {
        completionMap.set(c.userId, new Set());
      }
      completionMap.get(c.userId)!.add(c.challengeId);
    }

    // ✅ GROUP BY USER
    const userMap = new Map<
      string,
      {
        timezone: string;
        enrollments: typeof enrollments;
      }
    >();

    for (const e of enrollments) {
      if (!userMap.has(e.userId)) {
        userMap.set(e.userId, {
          timezone: e.user?.timezone || "UTC",
          enrollments: [],
        });
      }

      userMap.get(e.userId)!.enrollments.push(e);
    }

    let actualSent = 0;

    // ✅ PROCESS PER USER
    for (const [userId, data] of userMap.entries()) {
      const { timezone, enrollments } = data;

      const userNow = toZonedTime(now, timezone);

      // ✅ Build today's target time
      const target = new Date(userNow);
      target.setHours(hour, minute, 0, 0);

      const isTimePassed = userNow >= target;

      // ✅ Check if already notified today (ANY enrollment)
      const alreadyNotifiedToday = enrollments.some(
        (e) =>
          e.lastNotifiedAt &&
          isSameDay(toZonedTime(e.lastNotifiedAt, timezone), userNow),
      );

      console.log({
        userId,
        userTime: userNow.toLocaleTimeString(),
        targetTime: target.toLocaleTimeString(),
        isTimePassed,
        alreadyNotifiedToday,
        totalEnrollments: enrollments.length,
      });

      // ❌ Skip if not time OR already notified
      if (!isTimePassed || alreadyNotifiedToday) continue;

      // ✅ Check if user has ANY incomplete challenge
      const hasPending = enrollments.some((e) => {
        const completed = completionMap.get(userId);
        return !completed || !completed.has(e.challengeId);
      });

      if (!hasPending) continue;

      // ✅ SEND ONLY ONCE PER USER
      await sendPushNotificationFromDBToUser({
        type: "DAILY_CHALLENGE_PUSH_NOTIFICATION",
        userId,
        context: {},
      });

      actualSent++;

      // ✅ Update ALL enrollments for that user
      await prisma.challengeEnrollment.updateMany({
        where: {
          userId,
        },
        data: {
          lastNotifiedAt: now,
        },
      });
    }

    return NextResponse.json({
      message: "Notifications processed",
      total: enrollments.length,
      usersProcessed: userMap.size,
      actualSent,
    });
  } catch (error) {
    console.error("🔥 Notification Cron Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
