import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";
import { createLogWin } from "@/lib/utils/makeover-program/makeover-daily-tasks/createLogWin";
import { createWeeklyWinMessage } from "@/lib/utils/system-message-for-joining";

/* ---------------- Types ---------------- */
interface RequestBody {
    card: 1 | 2 | 3;
    taskId: string;
    areaId: number;
    weeklyShowUpDays?: number | string;
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

    const { card, taskId, areaId, weeklyShowUpDays } = (await req.json()) as RequestBody;

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

    /* ---------- Validate area ownership ---------- */
    const ownsArea = await prisma.userMakeoverArea.findFirst({
        where: { userId: user.id, programId, areaId },
    });

    if (!ownsArea) {
        return NextResponse.json({ error: "Invalid areaId" }, { status: 403 });
    }

    /* ---------- Get all user areaIds ---------- */
    const userAreas = await prisma.userMakeoverArea.findMany({
        where: { userId: user.id, programId },
        select: { areaId: true },
    });

    const areaIds = userAreas.map((a) => a.areaId);

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
        let shouldPostWeeklyWinMessage = false;
        let shouldCreateDailyWinLog = false;

        const isFirstSundayTask =
            !progress.card1WeeklyWin &&
            !progress.card1DailyWin &&
            !progress.card1NextWeekDone &&
            !progress.card2Done &&
            !progress.card3Done;

        if (isFirstSundayTask && !progress.card3Done) {
            await tx.sundayProgressLog.update({
                where: { id: progress.id },
                data: { card3Done: true },
            });
            pointsAwarded += POINTS.CARD_3_TOTAL;
        }

        /* ---------- CARD 1 ---------- */
        if (card === 1) {
            if (taskId === "weekly-win" && !progress.card1WeeklyWin) {
                await tx.sundayProgressLog.update({
                    where: { id: progress.id },
                    data: { card1WeeklyWin: true },
                });
                pointsAwarded = POINTS.CARD_1_TASK;
                shouldPostWeeklyWinMessage = true;
            }

            if (taskId === "daily-win" && !progress.card1DailyWin) {
                await tx.sundayProgressLog.update({
                    where: { id: progress.id },
                    data: { card1DailyWin: true },
                });
                pointsAwarded = POINTS.CARD_1_TASK;
                shouldCreateDailyWinLog = true;
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

        return {
            pointsAwarded,
            shouldPostWeeklyWinMessage,
            shouldCreateDailyWinLog,
        };
    });

    /* ================= SIDE EFFECTS (AFTER COMMIT) ================= */

    if (result.shouldCreateDailyWinLog) {
        await createLogWin({
            userId: user.id,
            content: "Done Sunday tasks",
        });
    }

    if (result.shouldPostWeeklyWinMessage) {
        const areaChallengeMaps =
            await prisma.makeoverAreaChallengeMap.findMany({
                where: {
                    programId,
                    areaId: { in: areaIds },
                },
                select: { challengeId: true },
            });

        if (areaChallengeMaps.length > 0) {
            await Promise.all(
                areaChallengeMaps.map(({ challengeId }) =>
                    createWeeklyWinMessage(
                        user.id,
                        challengeId,
                        `I showed up for ${weeklyShowUpDays} day${weeklyShowUpDays === 1 ? "" : "s"} this week 🎉`,
                        "USER"
                    )
                )
            );
        }
    }

    return NextResponse.json({
        success: true,
        card,
        taskId,
        areaId,
        pointsAwarded: result.pointsAwarded,
    });
}
