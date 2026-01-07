// /api/makeover-program/makeover-daily-tasks
// Handles: Mark Daily Action Done (MULTI-AREA, SINGLE REQUEST)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function POST(req: Request) {
    const session = await checkRole("USER");
    const user = session.user;

    const { areaIds, date } = await req.json();

    if (!Array.isArray(areaIds) || areaIds.length === 0 || !date) {
        return NextResponse.json(
            { error: "areaIds[] and date are required" },
            { status: 400 }
        );
    }

    const day = new Date(date);

    /* -------------------------------------------------
       0️⃣ Resolve Program
    ------------------------------------------------- */
    const program = await prisma.program.findFirst({
        where: { slug: "2026-complete-makeover" },
    });

    if (!program) {
        return NextResponse.json(
            { error: "Program not found" },
            { status: 404 }
        );
    }

    const programId = program.id;

    let totalPointsAwarded = 0;
    const completedAreas: number[] = [];

    /* -------------------------------------------------
       1️⃣ Process each area SAFELY
    ------------------------------------------------- */
    for (const areaId of areaIds) {
        /* -------------------------------
           Check existing progress
        ------------------------------- */
        const existingLog = await prisma.makeoverProgressLog.findUnique({
            where: {
                userId_programId_areaId_date: {
                    userId: user.id,
                    programId,
                    areaId,
                    date: day,
                },
            },
        });
        const alreadyDone = existingLog?.actionDone === true;
        if (alreadyDone) {
            return NextResponse.json({
                success: true,
                alreadyCompleted: true,
                totalPointsAwarded: 0,
                areaId,
                date: day,
            });
        }

        /* -------------------------------
           Atomic writes (FAST transaction)
        ------------------------------- */
        await prisma.$transaction([
            prisma.makeoverProgressLog.upsert({
                where: {
                    userId_programId_areaId_date: {
                        userId: user.id,
                        programId,
                        areaId,
                        date: day,
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
                    date: day,
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
            }),
        ]);

        totalPointsAwarded += 25;
        completedAreas.push(areaId);

        /* -------------------------------
           Challenge enrollment
        ------------------------------- */
        const enrollment =
            await prisma.userMakeoverChallengeEnrollment.findUnique({
                where: {
                    userId_programId_areaId: {
                        userId: user.id,
                        programId,
                        areaId,
                    },
                },
                include: {
                    enrollment: true,
                },
            });

        if (!enrollment) continue;

        /* -------------------------------
           Mark challenge task done
        ------------------------------- */
        await prisma.userChallengeTask.updateMany({
            where: {
                enrollmentId: enrollment.enrollmentId,
                isCompleted: false,
            },
            data: {
                isCompleted: true,
                lastCompletedAt: new Date(),
            },
        });

        /* -------------------------------
           Update streak (SAFE)
        ------------------------------- */
        const nextStreak = enrollment.enrollment.currentStreak + 1;

        await prisma.challengeEnrollment.update({
            where: { id: enrollment.enrollmentId },
            data: {
                currentStreak: nextStreak,
                longestStreak: Math.max(
                    enrollment.enrollment.longestStreak,
                    nextStreak
                ),
                lastStreakUpdate: new Date(),
            },
        });
        await prisma.completionRecord.create({
            data: {
                userId: user.id,
                challengeId: enrollment.challengeId,
                date: day,
                status: "COMPLETED",
            },
        });

    }

    /* -------------------------------------------------
       2️⃣ Final Response
    ------------------------------------------------- */
    return NextResponse.json({
        success: true,
        completedAreas,
        totalPointsAwarded,
        date,
    });
}
