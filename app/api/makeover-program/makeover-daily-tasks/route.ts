// /api/makeover-program/makeover-daily-tasks
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";

interface RequestBody {
  areaId: number;
  date: string;
}

export async function POST(req: Request) {
  /* -------------------------------------------------
     0️⃣ Auth
  ------------------------------------------------- */
  const session = await checkRole("USER");
  const user = session.user;

  const body = (await req.json()) as RequestBody;
  const { areaId, date } = body;

  if (!areaId || !date) {
    return NextResponse.json(
      { error: "areaId and date are required" },
      { status: 400 }
    );
  }

  const today = normalizeDateUTC();

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
     2️⃣ Check if already completed today (GUARD)
  ------------------------------------------------- */
  const existingLog = await prisma.makeoverProgressLog.findUnique({
    where: {
      userId_programId_areaId_date: {
        userId: user.id,
        programId,
        areaId,
        date: today,
      },
    },
  });

  if (
    existingLog &&
    existingLog.identityDone &&
    existingLog.actionDone &&
    existingLog.winLogged &&
    existingLog.pointsEarned > 0
  ) {
    return NextResponse.json({
      success: true,
      alreadyCompleted: true,
      pointsAwarded: 0,
    });
  }

  /* -------------------------------------------------
     3️⃣ Fetch enrollment (for challenge sync)
  ------------------------------------------------- */
  const enrollment = await prisma.userMakeoverChallengeEnrollment.findFirst({
    where: {
      userId: user.id,
      programId,
      areaId,
    },
    include: {
      enrollment: true,
    },
  });

  /* -------------------------------------------------
     4️⃣ Atomic transaction
  ------------------------------------------------- */
  await prisma.$transaction([
    // Progress log
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
        identityDone: true,
        actionDone: true,
        winLogged: true,
        pointsEarned: 75,
      },
      create: {
        userId: user.id,
        programId,
        areaId,
        date: today,
        identityDone: true,
        actionDone: true,
        winLogged: true,
        pointsEarned: 75,
      },
    }),

    // Lifetime area points
    prisma.makeoverPointsSummary.upsert({
      where: {
        userId_programId_areaId: {
          userId: user.id,
          programId,
          areaId,
        },
      },
      update: {
        totalPoints: { increment: 75 },
      },
      create: {
        userId: user.id,
        programId,
        areaId,
        totalPoints: 75,
      },
    }),

    // Challenge sync (if enrolled)
    ...(enrollment
      ? [
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
              currentStreak: enrollment.enrollment.currentStreak + 1,
              longestStreak: Math.max(
                enrollment.enrollment.longestStreak,
                enrollment.enrollment.currentStreak + 1
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
          }),
        ]
      : []),
  ]);

  /* -------------------------------------------------
     5️⃣ Response
  ------------------------------------------------- */
  return NextResponse.json({
    success: true,
    areaId,
    pointsAwarded: 75,
    date: today,
  });
}
