import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    /* ───────────── AUTH ───────────── */
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { programId, areaIds } = await req.json();

    if (!programId || !Array.isArray(areaIds) || areaIds.length !== 3) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* ───────────── FETCH AREA → CHALLENGE MAP ───────────── */
    const mappings = await prisma.makeoverAreaChallengeMap.findMany({
      where: {
        programId,
        areaId: { in: areaIds },
      },
      select: {
        areaId: true,
        challengeId: true,
      },
    });

    if (!mappings.length) {
      return NextResponse.json({ success: true });
    }

    const challengeIds = [...new Set(mappings.map(m => m.challengeId))];

    /* ───────────── UPSERT ENROLLMENTS (SAFE) ───────────── */
    const enrollmentMap = new Map<string, string>();

    for (const challengeId of challengeIds) {
      const enrollment = await prisma.challengeEnrollment.upsert({
        where: {
          userId_challengeId: {
            userId,
            challengeId,
          },
        },
        update: {},
        create: {
          userId,
          challengeId,
          status: "IN_PROGRESS",
        },
      });

      enrollmentMap.set(challengeId, enrollment.id);
    }

    /* ───────────── FETCH TEMPLATE TASKS ───────────── */
    const templateTasks = await prisma.challengeTask.findMany({
      where: {
        challengeId: { in: challengeIds },
      },
      select: {
        id: true,
        challengeId: true,
        description: true,
      },
    });

    const tasksByChallenge = new Map<string, typeof templateTasks>();

    for (const task of templateTasks) {
      const list = tasksByChallenge.get(task.challengeId) ?? [];
      list.push(task);
      tasksByChallenge.set(task.challengeId, list);
    }

    /* ───────────── FETCH EXISTING USER TASKS ───────────── */
    const existingUserTasks = await prisma.userChallengeTask.findMany({
      where: {
        enrollmentId: { in: [...enrollmentMap.values()] },
      },
      select: { enrollmentId: true },
    });

    const enrollmentWithTasks = new Set(
      existingUserTasks.map(t => t.enrollmentId)
    );

    /* ───────────── CREATE USER TASKS ───────────── */
    const userTasksToCreate = [];

    for (const [challengeId, enrollmentId] of enrollmentMap.entries()) {
      if (enrollmentWithTasks.has(enrollmentId)) continue;

      const tasks = tasksByChallenge.get(challengeId) ?? [];

      for (const task of tasks) {
        userTasksToCreate.push({
          enrollmentId,
          templateTaskId: task.id,
          description: task.description,
        });
      }
    }

    if (userTasksToCreate.length) {
      await prisma.userChallengeTask.createMany({
        data: userTasksToCreate,
      });
    }

    /* ───────────── LINK MAKEOVER → CHALLENGE ───────────── */
    const makeoverEnrollmentData: {
      userId: string;
      programId: string;
      areaId: number;
      challengeId: string;
      enrollmentId: string;
    }[] = [];

    for (const map of mappings) {
      const enrollmentId = enrollmentMap.get(map.challengeId);
      if (!enrollmentId) continue;

      makeoverEnrollmentData.push({
        userId,
        programId,
        areaId: map.areaId,
        challengeId: map.challengeId,
        enrollmentId,
      });
    }

    if (makeoverEnrollmentData.length) {
      await prisma.userMakeoverChallengeEnrollment.createMany({
        data: makeoverEnrollmentData,
        skipDuplicates: true,
      });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ENROLLMENT ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
