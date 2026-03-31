// /api/challenge/my-challenge/participants-progress
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await checkRole("USER");
 

    const userId = session.user.id;

    // 1. Get all challenges created by this user
    const challenges = await prisma.challenge.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    const challengeIds = challenges.map((c) => c.id);

    if (challengeIds.length === 0) {
      return NextResponse.json({ participants: [] });
    }

    // 2. Get all enrollments (participants)
    const enrollments = await prisma.challengeEnrollment.findMany({
      where: { challengeId: { in: challengeIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        challenge: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // 3. Completed days per user per challenge
    const completionRecords = await prisma.completionRecord.groupBy({
      by: ["userId", "challengeId"],
      _count: { id: true },
      where: {
        challengeId: { in: challengeIds },
      },
    });

    const completionMap = new Map(
      completionRecords.map((rec) => [
        `${rec.userId}_${rec.challengeId}`,
        rec._count.id,
      ])
    );

    // 4. Last active date
    const lastActive = await prisma.userChallengeTask.groupBy({
      by: ["enrollmentId"],
      _max: { lastCompletedAt: true },
    });

    const lastActiveMap = new Map(
      lastActive.map((l) => [l.enrollmentId, l._max.lastCompletedAt])
    );

    // 5. Build response
    const participants = enrollments.map((e) => {
      const totalDays =
        Math.floor(
          (new Date(e.challenge.endDate).getTime() -
            new Date(e.challenge.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      const completedDays =
        completionMap.get(`${e.userId}_${e.challengeId}`) || 0;

      const completionPercentage = Math.round(
        (completedDays / totalDays) * 100
      );

      const lastActiveDate =
        lastActiveMap.get(e.id) || e.joinedAt;

      return {
        participantId: e.user.id,
        name: e.user.name,
        email: e.user.email,
        avatar: e.user.image,
        programId: e.challenge.id,
        programTitle: e.challenge.title,
        joinedAt: e.joinedAt,
        lastActiveDate,
        completedDays,
        totalDays,
        completionPercentage,
        isCertificateIssued: e.isCertificateIssued,
          programType: "CHALLENGE",
      };
    });

    return NextResponse.json({
      success: true,
      totalParticipants: participants.length,
      participants,
    });
  } catch (error) {
    console.error("GET ALL PARTICIPANTS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}