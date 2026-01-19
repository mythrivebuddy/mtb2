import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";
import { createLogWin } from "@/lib/utils/makeover-program/makeover-daily-tasks/createLogWin";
function normalizeToUTCStartOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/* ---------------- CONSTANTS ---------------- */
const POINTS = {
  PER_TASK: 25,
} as const;

/* ---------------- Types ---------------- */
interface RequestBody {
  areaId: number;
  date: string;
  field?: "identityDone" | "actionDone" | "winLogged";
  value?: boolean;
  actionText?: string;
}

/* ---------------- Helpers ---------------- */
function formatDayWithOrdinal(date: Date) {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day}${suffix} ${month}`;
}

/* ---------------- POST ---------------- */
export async function POST(req: Request) {
  /* 0️⃣ Auth */
  const session = await checkRole("USER");
  const user = session.user;

  const body = (await req.json()) as RequestBody;
  const { areaId, date, field, value, actionText } = body;

  if (!areaId || !date || !field || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "areaId, date, field and value are required" },
      { status: 400 },
    );
  }

  const today = normalizeDateUTC(new Date(date));

  /* 1️⃣ Resolve Program */
  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const programId = program.id;

  /* -------------------------------------------------
     2️⃣ Fetch existing progress (to prevent double points)
  ------------------------------------------------- */
  const existing = await prisma.makeoverProgressLog.findUnique({
    where: {
      userId_programId_areaId_date: {
        userId: user.id,
        programId,
        areaId,
        date: today,
      },
    },
  });

  const wasAlreadyChecked = existing ? existing[field] === true : false;

  /* -------------------------------------------------
     3️⃣ Upsert progress (checkbox state)
  ------------------------------------------------- */
  const progress = await prisma.makeoverProgressLog.upsert({
    where: {
      userId_programId_areaId_date: {
        userId: user.id,
        programId,
        areaId,
        date: today,
      },
    },
    update: {
      [field]: value,
    },
    create: {
      userId: user.id,
      programId,
      areaId,
      date: today,
      identityDone: field === "identityDone" ? value : false,
      actionDone: field === "actionDone" ? value : false,
      winLogged: field === "winLogged" ? value : false,
      pointsEarned: 0,
    },
  });

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
     4️⃣ Award +25 points (ONLY first time)
  ------------------------------------------------- */
  let pointsAwarded = 0;

  if (value === true && !wasAlreadyChecked) {
    pointsAwarded = POINTS.PER_TASK;

    await prisma.makeoverPointsSummary.upsert({
      where: {
        userId_programId_areaId: {
          userId: user.id,
          programId,
          areaId,
        },
      },
      update: {
        totalPoints: { increment: POINTS.PER_TASK },
      },
      create: {
        userId: user.id,
        programId,
        areaId,
        totalPoints: POINTS.PER_TASK,
      },
    });
  }
  // completes challenge tasks
  if (value === true && !wasAlreadyChecked) {
    if (enrollment) {
      // 🎯 Map checkbox → description keyword
      const descriptionMap: Record<typeof field, string> = {
        identityDone: "Affirm / Script / Visualize",
        actionDone: "Daily Action",
        winLogged: "Record the win",
      };

      const keyword = descriptionMap[field];

      await prisma.$transaction(async (tx) => {
        // 1️⃣ Find EXACT matching task (still incomplete)
        const task = await tx.userChallengeTask.findFirst({
          where: {
            enrollmentId: enrollment.enrollmentId,
            isCompleted: false,
            description: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        });

        // ⛔ No matching task → do nothing
        if (!task) return;

        // 2️⃣ Complete ONLY this task
        await tx.userChallengeTask.update({
          where: { id: task.id },
          data: {
            isCompleted: true,
            lastCompletedAt: new Date(),
          },
        });


      });
    }
  }

  const startOfToday = normalizeDateUTC(today);

  const incompleteTasks = await prisma.userChallengeTask.count({
    where: {
      enrollmentId: enrollment?.enrollmentId,
      OR: [
        { isCompleted: false },
        {
          lastCompletedAt: {
            lt: startOfToday,
          },
        },
      ],
    },
  });

  const isDayComplete = incompleteTasks === 0;


  if (isDayComplete) {
    if (enrollment) {
      await prisma.$transaction(async (tx) => {
        // 🔒 Guard: already counted today?
       

        const alreadyCompleted = await tx.completionRecord.findUnique({
          where: {
            userId_challengeId_date: {
              userId: user.id,
              challengeId: enrollment.challengeId,
              date: today,
            },
          },
        });

        if (alreadyCompleted) {
          return;
        }

        // ✅ Increment streak ONCE
        const now = new Date();
        const todayStart = normalizeToUTCStartOfDay(now);

        const yesterday = new Date(todayStart);
        yesterday.setUTCDate(todayStart.getUTCDate() - 1);

        const lastUpdateDate = enrollment.enrollment.lastStreakUpdate
          ? normalizeToUTCStartOfDay(
            new Date(enrollment.enrollment.lastStreakUpdate),
          )
          : null;

        let newStreak = enrollment.enrollment.currentStreak;

        // 🔴 Reset streak if missed a day
        if (newStreak > 0 && lastUpdateDate && lastUpdateDate < yesterday) {
          newStreak = 0;
        }

        // 🟢 Continue or start streak
        if (
          lastUpdateDate &&
          lastUpdateDate.getTime() === yesterday.getTime()
        ) {
          newStreak += 1; // continue streak
        } else if (!lastUpdateDate || lastUpdateDate < yesterday) {
          newStreak = 1; // start new streak
        }

        // 🧠 If already updated today → do nothing
        if (
          lastUpdateDate &&
          lastUpdateDate.getTime() === todayStart.getTime()
        ) {
          return;
        }

        // console.log("[STREAK] Updating streak", {
        //   newStreak,
        // });

        await tx.challengeEnrollment.update({
          where: { id: enrollment.enrollmentId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(
              enrollment.enrollment.longestStreak,
              newStreak,
            ),
            lastStreakUpdate: now,
          },
        });

        // ✅ Mark day completed

        await tx.completionRecord.upsert({
          where: {
            userId_challengeId_date: {
              userId: user.id,
              challengeId: enrollment.challengeId,
              date: today,
            },
          },
          update: { status: "COMPLETED" },
          create: {
            userId: user.id,
            challengeId: enrollment.challengeId,
            date: today,
            status: "COMPLETED",
          },
        });
      });
    }
  }

  /* -------------------------------------------------
     5️⃣ Log WIN (only when winLogged checked first time)
  ------------------------------------------------- */
  if (
    field === "winLogged" &&
    value === true &&
    !wasAlreadyChecked &&
    actionText
  ) {
    const prettyDate = formatDayWithOrdinal(new Date(today));

    try {
      await createLogWin({
        userId: user.id,
        content: `Done ${actionText.trim()} on ${prettyDate}`,
      });
    } catch (err) {
      console.error("Log win failed:", err);
    }
  }

  /* -------------------------------------------------
     6️⃣ Response
  ------------------------------------------------- */
  return NextResponse.json({
    success: true,
    areaId,
    field,
    value,
    pointsAwarded,
    progress: {
      identityDone: progress.identityDone,
      actionDone: progress.actionDone,
      winLogged: progress.winLogged,
    },
  });
}


