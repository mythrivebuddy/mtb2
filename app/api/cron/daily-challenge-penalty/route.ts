// app/api/cron/daily-challenge-penalty/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deductJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";

export async function GET() {
    try {
        const now = new Date();

        const startOfToday = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            )
        );

        const endOfToday = new Date(startOfToday);
        endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

        const enrollments = await prisma.challengeEnrollment.findMany({
            where: {
                status: "IN_PROGRESS",
                challenge: {
                    status: "ACTIVE",
                },
            },
            select: {
                id: true,
                userId: true,
                challengeId: true,
            },
        });

        // ✅ store per user total + breakdown
        const userPenaltyMap = new Map<
            string,
            { total: number; breakdown: string[] }
        >();

        for (const enrollment of enrollments) {
            const [user, challenge, tasks] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: enrollment.userId },
                    include: { plan: true },
                }),
                prisma.challenge.findUnique({
                    where: { id: enrollment.challengeId },
                    select: { id: true, penalty: true },
                }),
                prisma.userChallengeTask.findMany({
                    where: { enrollmentId: enrollment.id },
                    select: { lastCompletedAt: true },
                }),
            ]);

            if (!user || !challenge) continue;

            const completedToday = tasks.some((task) => {
                if (!task.lastCompletedAt) return false;
                return (
                    task.lastCompletedAt >= startOfToday &&
                    task.lastCompletedAt < endOfToday
                );
            });

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
                    }
                );

                const prev = userPenaltyMap.get(user.id) || {
                    total: 0,
                    breakdown: [],
                };

                prev.total += result.deductedAmount;

                prev.breakdown.push(
                    `${result.deductedAmount} GP (${result.baseAmount} × ${result.multiplier})`
                );

                userPenaltyMap.set(user.id, prev);
            }
        }

        // ✅ send exact message per user
        for (const [userId, data] of userPenaltyMap.entries()) {
            await sendPushNotificationMultipleUsers(
                [userId],
                "Challenge Penalty ⚠️",
                `You missed your daily tasks in one or more challenges.\n\n${data.total} GP has been deducted.\n\nDetails: ${data.breakdown.join(", ")}\n\nStay consistent tomorrow to avoid penalties 💪`,
                { url: "/dashboard/challenge" }
            );
        }

        return NextResponse.json({
            success: true,
            processed: enrollments.length,
            penalizedUsers: userPenaltyMap.size,
        });
    } catch (error) {
        console.error("CRON ERROR:", error);
        return NextResponse.json(
            { error: "Cron failed" },
            { status: 500 }
        );
    }
}