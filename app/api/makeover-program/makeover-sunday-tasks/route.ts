import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";
import { createLogWin } from "@/lib/utils/makeover-program/makeover-daily-tasks/createLogWin";

/* ---------------- Types ---------------- */
interface RequestBody {
  card: 1 | 2 | 3;
  taskId: string;
  areaId: number;
}

/* ---------------- Constants ---------------- */
const POINTS = {
  CARD_1_TASK: 50,
  CARD_1_NEXT_WEEK: 50,
  CARD_2_TOTAL: 150,
  CARD_3_TOTAL: 150,
} as const;

/* ---------------- POST ---------------- */
export async function POST(req: Request) {
  const session = await checkRole("USER");
  const user = session.user;

  const body = (await req.json()) as RequestBody;
  const { card, taskId, areaId } = body;

  if (!card || !taskId || !areaId) {
    return NextResponse.json(
      { error: "card, taskId and areaId are required" },
      { status: 400 }
    );
  }

  const today = normalizeDateUTC();

  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const programId = program.id;

  // 🔐 Validate area ownership
  const ownsArea = await prisma.userMakeoverArea.findFirst({
    where: { userId: user.id, programId, areaId },
  });

  if (!ownsArea) {
    return NextResponse.json({ error: "Invalid areaId" }, { status: 403 });
  }

  /* ================= TRANSACTION ================= */
  const result = await prisma.$transaction(async (tx) => {
    const progress =
      (await tx.sundayProgressLog.findUnique({
        where: {
          uniq_sunday_progress: {
            userId: user.id,
            programId,
            sundayCardId: card,
            date: today,
          },
        },
      })) ??
      (await tx.sundayProgressLog.create({
        data: {
          userId: user.id,
          programId,
          sundayCardId: card,
          date: today,
        },
      }));

    let pointsAwarded = 0;

    /* ---------- CARD 1 ---------- */
    if (card === 1) {
      if (taskId === "weekly-win" && !progress.card1WeeklyWin) {
        await tx.sundayProgressLog.update({
          where: { id: progress.id },
          data: { card1WeeklyWin: true },
        });
        pointsAwarded = POINTS.CARD_1_TASK;
      }

      if (taskId === "daily-win" && !progress.card1DailyWin) {
        await tx.sundayProgressLog.update({
          where: { id: progress.id },
          data: { card1DailyWin: true },
        });
        pointsAwarded = POINTS.CARD_1_TASK;

        await createLogWin({
          userId: user.id,
          content: "Done Sunday tasks",
        });
      }

      if (
        taskId.startsWith("next-week") &&
        !progress.card1NextWeekDone
      ) {
        await tx.sundayProgressLog.update({
          where: { id: progress.id },
          data: { card1NextWeekDone: true },
        });
        pointsAwarded = POINTS.CARD_1_NEXT_WEEK;
      }
    }

    /* ---------- CARD 2 ---------- */
    if (card === 2 && !progress.card2Done) {
      await tx.sundayProgressLog.update({
        where: { id: progress.id },
        data: { card2Done: true },
      });
      pointsAwarded = POINTS.CARD_2_TOTAL;
    }

    /* ---------- CARD 3 ---------- */
    if (card === 3 && !progress.card3Done) {
      await tx.sundayProgressLog.update({
        where: { id: progress.id },
        data: { card3Done: true },
      });
      pointsAwarded = POINTS.CARD_3_TOTAL;
    }

    if (pointsAwarded > 0) {
      await tx.makeoverPointsSummary.upsert({
        where: {
          userId_programId_areaId: {
            userId: user.id,
            programId,
            areaId,
          },
        },
        update: {
          totalPoints: { increment: pointsAwarded },
        },
        create: {
          userId: user.id,
          programId,
          areaId,
          totalPoints: pointsAwarded,
        },
      });
    }

    return pointsAwarded;
  });

  return NextResponse.json({
    success: true,
    card,
    taskId,
    areaId,
    pointsAwarded: result,
  });
}
