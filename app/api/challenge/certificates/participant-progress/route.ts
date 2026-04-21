// /api/participants-progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { ChallengeJoinMode } from "@prisma/client";

type ParticipantProgress = {
  participantId: string;
  name: string;
  email: string;
  avatar: string | null;
  programId: string;
  programTitle: string;
  joinedAt: Date;
  lastActiveDate: Date;
  completedDays: number;
  totalDays: number;
  completionPercentage: number;
  completionThreshold: number; // ADD THIS
  isCertificateIssued: boolean;
  certificateUrl: string | null;
  programType: "CHALLENGE" | "MMP";
};

export async function GET(req: NextRequest) {
  try {
    const session = await checkRole(["USER","ADMIN"]);
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // all | challenges | mmp
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let fromDate: Date;
    let toDate: Date = new Date();

    if (fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);
    } else {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
    }

    let participants: ParticipantProgress[] = [];

    // ============================
    // CHALLENGE PARTICIPANTS
    // ============================
    if (type === "all" || type === "challenges") {
      const challenges = await prisma.challenge.findMany({
        where: {
          creatorId: userId,
          startDate: { lte: toDate },
          endDate: { gte: fromDate },
          joinMode:ChallengeJoinMode.MANUAL
        },
        select: { id: true, title: true, startDate: true, endDate: true },
      });

      const challengeIds = challenges.map((c) => c.id);

      if (challengeIds.length > 0) {
        const enrollments = await prisma.challengeEnrollment.findMany({
          where: {
            challengeId: { in: challengeIds },
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          distinct: ["userId", "challengeId"],
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            challenge: {
              select: { id: true, title: true, startDate: true, endDate: true },
            },
          },
        });

        const userChallengePairs = enrollments.map((e) => ({
          userId: e.userId,
          challengeId: e.challengeId,
        }));

        const completionRecords = await prisma.completionRecord.groupBy({
          by: ["userId", "challengeId"],
          _count: { id: true },
          where: { OR: userChallengePairs, status: "COMPLETED" },
        });

        const certificates = await prisma.challengeCertificate.findMany({
          where: {
            OR: userChallengePairs.map((p) => ({
              participantId: p.userId,
              challengeId: p.challengeId,
            })),
          },
        });

        const completionMap = new Map(
          completionRecords.map((rec) => [
            `${rec.userId}_${rec.challengeId}`,
            rec._count.id,
          ]),
        );

        const certificateMap = new Map(
          certificates.map((c) => [
            `${c.participantId}_${c.challengeId}`,
            c.certificateUrl,
          ]),
        );

        const challengeParticipants: ParticipantProgress[] = enrollments.map(
          (e) => {
            const totalDays =
              Math.floor(
                (new Date(e.challenge.endDate).getTime() -
                  new Date(e.challenge.startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ) + 1;

            const completedDays =
              completionMap.get(`${e.userId}_${e.challengeId}`) || 0;

            const completionPercentage =
              totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            return {
              participantId: e.user.id,
              name: e.user.name,
              email: e.user.email,
              avatar: e.user.image,
              programId: e.challenge.id,
              programTitle: e.challenge.title,
              joinedAt: e.joinedAt,
              lastActiveDate: e.joinedAt,
              completedDays,
              totalDays,
              completionPercentage,
              completionThreshold: 75, // ADD THIS
              isCertificateIssued: e.isCertificateIssued,
              certificateUrl:
                certificateMap.get(`${e.user.id}_${e.challenge.id}`) || null,
              programType: "CHALLENGE" as const,
            };
          },
        );

        participants.push(...challengeParticipants);
      }
    }

    // ============================
    // MMP PARTICIPANTS
    // ============================
    if (type === "all" || type === "mmp") {
      const programs = await prisma.program.findMany({
        where: {
          createdBy: userId,
          isActive: true,
        },
        select: { id: true, name: true, durationDays: true, createdAt: true },
      });

      const programIds = programs.map((p) => p.id);

      if (programIds.length > 0) {
        const purchases = await prisma.miniMasteryProgramPayment.findMany({
          where: {
            programId: { in: programIds },
            status: "PAID",
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          distinct: ["userId", "programId"],
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            program: {
              select: {
                id: true,
                name: true,
                durationDays: true,
                completionThreshold: true,
              },
            },
          },
        });
        const completionCounts = await prisma.miniMasteryProgressLog.groupBy({
          by: ["userId", "programId"],
          _count: { dayNumber: true },
          where: {
            programId: { in: programIds },
            isCompleted: true,
          },
        });
        const courseCompletions =
          await prisma.miniMasteryCourseCompletion.findMany({
            where: {
              programId: { in: programIds },
            },
          });

        const certificateMap = new Map(
          courseCompletions.map((c) => [
            `${c.userId}_${c.programId}`,
            {
              isIssued: c.courseCompleted,
              certificateUrl: c.certificateUrl,
            },
          ]),
        );
        const completionMap = new Map(
          completionCounts.map((c) => [
            `${c.userId}_${c.programId}`,
            c._count.dayNumber,
          ]),
        );
        const mmpParticipants: ParticipantProgress[] = purchases.map((p) => {
          const totalDays = p.program.durationDays || 0;

          const completedDays =
            completionMap.get(`${p.user.id}_${p.program.id}`) || 0;

          const completionPercentage =
            totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

          const certData = certificateMap.get(`${p.user.id}_${p.program.id}`);

          return {
            participantId: p.user.id,
            name: p.user.name,
            email: p.user.email,
            avatar: p.user.image,
            programId: p.program.id,
            programTitle: p.program.name,
            joinedAt: p.purchasedAt,
            lastActiveDate: p.purchasedAt,
            completedDays,
            totalDays,
            completionPercentage,
            completionThreshold: p.program.completionThreshold || 100,
            isCertificateIssued: certData?.isIssued || false,
            certificateUrl: certData?.certificateUrl || null,
            programType: "MMP" as const,
          };
        });

        participants.push(...mmpParticipants);
      }
    }

    // ============================
    // STATUS FILTER
    // ============================
    // ============================
    // REMOVE DUPLICATES (ONE USER + ONE PROGRAM)
    // ============================
    const uniqueMap = new Map<string, ParticipantProgress>();

    participants.forEach((p) => {
      const key = `${p.participantId}_${p.programId}_${p.programType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    });

    participants = Array.from(uniqueMap.values());

    let filteredParticipants: ParticipantProgress[] = participants;

    if (status === "eligible") {
      filteredParticipants = filteredParticipants.filter(
        (p) =>
          p.completionPercentage >= p.completionThreshold &&
          !p.isCertificateIssued,
      );
    }

    if (status === "not_eligible") {
      filteredParticipants = filteredParticipants.filter(
        (p) =>
          p.completionPercentage < p.completionThreshold &&
          !p.isCertificateIssued,
      );
    }

    if (status === "issued") {
      filteredParticipants = filteredParticipants.filter(
        (p) => p.isCertificateIssued,
      );
    }
    // ============================
    // PAGINATION
    // ============================
    const start = (page - 1) * limit;
    const paginatedParticipants = filteredParticipants.slice(
      start,
      start + limit,
    );

    return NextResponse.json({
      success: true,
      participants: paginatedParticipants,
      total: filteredParticipants.length,
      totalPages: Math.ceil(filteredParticipants.length / limit),
      page,
    });
  } catch (error) {
    console.error("MERGED PARTICIPANTS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
