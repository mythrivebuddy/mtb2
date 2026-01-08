// /api/makeover-program/makeover-daily-tasks
// Handles: Mark Daily Action Done (MULTI-AREA, SINGLE REQUEST)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import type {
  MakeoverProgressLog,
  UserMakeoverChallengeEnrollment,
} from "@prisma/client";
import { normalizeDate } from "@/lib/utils/normalizeDate";

interface RequestBody {
  areaIds: number[];
  date: string;
}

export async function POST(req: Request) {
  /* -------------------------------------------------
     0️⃣ Auth
  ------------------------------------------------- */
  const session = await checkRole("USER");
  const user = session.user;

  const body = (await req.json()) as RequestBody;
  const { areaIds, date } = body;

  if (!Array.isArray(areaIds) || areaIds.length === 0 || !date) {
    return NextResponse.json(
      { error: "areaIds[] and date are required" },
      { status: 400 }
    );
  }

  const today = normalizeDate();
  

  /* -------------------------------------------------
     1️⃣ Resolve Program
  ------------------------------------------------- */
  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true },
  });

  if (!program) {
    return NextResponse.json(
      { error: "Program not found" },
      { status: 404 }
    );
  }

  const programId = program.id;

  /* -------------------------------------------------
     2️⃣ Preload all required data (ONE roundtrip)
  ------------------------------------------------- */
  const [existingLogs, enrollments] = await prisma.$transaction([
    prisma.makeoverProgressLog.findMany({
      where: {
        userId: user.id,
        programId,
        areaId: { in: areaIds },
        date: today,
      },
    }),

    prisma.userMakeoverChallengeEnrollment.findMany({
      where: {
        userId: user.id,
        programId,
        areaId: { in: areaIds },
      },
      include: {
        enrollment: true,
      },
    }),
  ]);

  /* -------------------------------------------------
     3️⃣ Build write operations
  ------------------------------------------------- */
  const operations = [];

  let totalPointsAwarded = 0;
  const completedAreas: number[] = [];

  for (const areaId of areaIds) {
    const alreadyDone = existingLogs.some(
  (log: MakeoverProgressLog) =>
    log.areaId === areaId &&
    log.identityDone === true &&
    log.actionDone === true &&
    log.winLogged === true
);


    if (alreadyDone) continue;

    /* ---- Progress Log + Points ---- */
    operations.push(
      prisma.makeoverProgressLog.upsert({
        where: {
          userId_programId_areaId_date: {
            userId: user.id,
            programId,
            areaId,
            date: today,
          },
        },
        update: {
          actionDone: true,
          pointsEarned: { increment: 25 },
        },
        create: {
          userId: user.id,
          programId,
          areaId,
          date: today,
          actionDone: true,
          pointsEarned: 25,
        },
      }),

      prisma.makeoverPointsSummary.upsert({
        where: {
          userId_programId_areaId: {
            userId: user.id,
            programId,
            areaId,
          },
        },
        update: {
          totalPoints: { increment: 25 },
        },
        create: {
          userId: user.id,
          programId,
          areaId,
          totalPoints: 25,
        },
      })
    );

    totalPointsAwarded += 25;
    completedAreas.push(areaId);

    /* ---- Challenge Progress ---- */
    const enrollment = enrollments.find(
      (e: UserMakeoverChallengeEnrollment) => e.areaId === areaId
    );

    if (!enrollment) continue;

    const nextStreak = enrollment.enrollment.currentStreak + 1;

    operations.push(
      prisma.userChallengeTask.updateMany({
        where: {
          enrollmentId: enrollment.enrollmentId,
          isCompleted: false,
        },
        data: {
          isCompleted: true,
          lastCompletedAt: new Date(),
        },
      }),

      prisma.challengeEnrollment.update({
        where: { id: enrollment.enrollmentId },
        data: {
          currentStreak: nextStreak,
          longestStreak: Math.max(
            enrollment.enrollment.longestStreak,
            nextStreak
          ),
          lastStreakUpdate: new Date(),
        },
      }),

      prisma.completionRecord.create({
        data: {
          userId: user.id,
          challengeId: enrollment.challengeId,
          date: today,
          status: "COMPLETED",
        },
      })
    );
  }

  /* -------------------------------------------------
     4️⃣ Execute ONE atomic transaction
  ------------------------------------------------- */
  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  /* -------------------------------------------------
     5️⃣ Final Response
  ------------------------------------------------- */
  return NextResponse.json({
    success: true,
    completedAreas,
    totalPointsAwarded,
    date:today,
  });
}
