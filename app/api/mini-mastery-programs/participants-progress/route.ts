// /api/mini-mastery-programs/participants-progress
// this route for fetching the programs of creator with thier participants progress
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;

    // 1. Programs created by this creator
    const programs = await prisma.program.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        durationDays: true,
      },
    });

    const programIds = programs.map((p) => p.id);

    if (programIds.length === 0) {
      return NextResponse.json({ participants: [] });
    }

    // 2. Participants (who purchased program)
    const purchases = await prisma.miniMasteryProgramPayment.findMany({
      where: {
        programId: { in: programIds },
        status: "PAID",
      },
      distinct: ["userId", "programId"],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            durationDays: true,
          },
        },
      },
    });

    // 3. Completed days per user per program
    const progress = await prisma.miniMasteryProgressLog.groupBy({
      by: ["userId", "programId"],
      _count: { id: true },
      where: {
        programId: { in: programIds },
        isCompleted: true,
      },
    });
    // 4. Last active date (last completed task date)
    const lastActive = await prisma.miniMasteryProgressLog.groupBy({
      by: ["userId", "programId"],
      _max: {
        completedAt: true,
      },
      where: {
        programId: { in: programIds },
        isCompleted: true,
      },
    });

    const lastActiveMap = new Map(
      lastActive.map((l) => [`${l.userId}_${l.programId}`, l._max.completedAt]),
    );

    const progressMap = new Map(
      progress.map((p) => [`${p.userId}_${p.programId}`, p._count.id]),
    );

    // 4. Certificate info
    const certificates = await prisma.miniMasteryCertificate.findMany({
      where: {
        programId: { in: programIds },
      },
      select: {
        participantId: true,
        programId: true,
        certificateUrl: true,
      },
    });

    const certificateMap = new Map(
      certificates.map((c) => [
        `${c.participantId}_${c.programId}`,
        c.certificateUrl,
      ]),
    );

    // 5. Build response
    const participants = purchases.map((p) => {
      const totalDays = p.program.durationDays || 0;

      const completedDays = progressMap.get(`${p.userId}_${p.programId}`) || 0;

      const completionPercentage =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      const certificateUrl =
        certificateMap.get(`${p.userId}_${p.programId}`) || null;
      const lastActiveDate =
        lastActiveMap.get(`${p.userId}_${p.programId}`) || p.purchasedAt;

      return {
        participantId: p.user.id,
        name: p.user.name,
        email: p.user.email,
        avatar: p.user.image,

        programId: p.program.id,
        programTitle: p.program.name,

        joinedAt: p.purchasedAt,
        lastActiveDate,

        completedDays,
        totalDays,
        completionPercentage,

        isCertificateIssued: !!certificateUrl,
        certificateUrl,

        programType: "MMP",
      };
    });

    return NextResponse.json({
      success: true,
      totalParticipants: participants.length,
      participants,
    });
  } catch (error) {
    console.error("MMP PARTICIPANTS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
