// /api/mini-mastery-programs/get-enrolled-students

import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/utils/mask-email";

export const GET = async (req: Request) => {
  try {
    const session = await checkRole(["ADMIN", "USER"]);
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);

    const programId = searchParams.get("programId");
    const completion = searchParams.get("completion");

    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const dateMode = searchParams.get("dateMode");
    const dateFilter = searchParams.get("dateFilter");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // ─────────────────────────────
    // DATE RANGE
    // ─────────────────────────────
    let from = new Date(0);
    let to = new Date();

    if (dateMode === "custom" && fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    } else if (dateFilter && dateFilter !== "all") {
      const days = Number(dateFilter);
      const temp = new Date();
      temp.setDate(temp.getDate() - days);
      from = temp;
    }

    // ─────────────────────────────
    // FETCH PROGRAMS (SINGLE OR ALL)
    // ─────────────────────────────
    const programs = await prisma.program.findMany({
      where: {
        createdBy: userId,
        ...(programId ? { id: programId } : {}),
      },
      select: {
        id: true,
        name: true,
        durationDays: true,
        completionThreshold: true,
        userProgramStates: {
          where: {
            onboardedAt: {
              gte: from,
              lte: to,
            },
          },
          select: {
            userId: true,
            onboardedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (programs.length === 0) {
      return NextResponse.json({
        programs: [],
        students: [],
        totalStudents: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const programIds = programs.map((p) => p.id);

    const userIds = programs.flatMap((p) =>
      p.userProgramStates.map((u) => u.userId),
    );

    // ─────────────────────────────
    // LOGS
    // ─────────────────────────────
    const logs = await prisma.miniMasteryProgressLog.findMany({
      where: {
        programId: { in: programIds },
        userId: { in: userIds },
        isCompleted: true,
      },
      select: {
        userId: true,
        programId: true,
        dayNumber: true,
      },
    });

    // ─────────────────────────────
    // CERTIFICATES
    // ─────────────────────────────
    const certs = await prisma.miniMasteryCertificate.findMany({
      where: {
        programId: { in: programIds },
        participantId: { in: userIds },
      },
      select: {
        participantId: true,
        programId: true,
      },
    });

    // ─────────────────────────────
    // MAP OPTIMIZATION
    // ─────────────────────────────
    const logMap = new Map<string, number>();

    logs.forEach((log) => {
      const key = `${log.userId}-${log.programId}`;
      const prev = logMap.get(key) || 0;

      if (log.dayNumber > prev) {
        logMap.set(key, log.dayNumber);
      }
    });

    const certSet = new Set(
      certs.map((c) => `${c.participantId}-${c.programId}`),
    );

    // ─────────────────────────────
    // TRANSFORM
    // ─────────────────────────────
    let students = programs.flatMap((program) =>
      program.userProgramStates.map((u) => {
        const key = `${u.userId}-${program.id}`;

        const currentDay = logMap.get(key) || 0;

        const progressPercent =
          program.durationDays && program.durationDays > 0
            ? Math.round((currentDay / program.durationDays) * 100)
            : 0;

        const hasCert = certSet.has(key);

        // ✅ COMPLETION BASED ON PERCENT
        const isCompletedProgram = program.completionThreshold
          ? progressPercent >= program.completionThreshold
          : progressPercent === 100;

        return {
          userId: u.userId,
          programId: program.id,
          programName: program.name,
          name: u.user.name,
          email: maskEmail(u.user.email),
          enrolledAt: u.onboardedAt,
          currentDay,
          progressPercent,
          certificateStatus: hasCert ? "ISSUED" : ("NOT_ISSUED" as const),
          isCompletedProgram,
        };
      }),
    );

    // ─────────────────────────────
    // FILTERS
    // ─────────────────────────────
    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search),
      );
    }

    if (status === "issued") {
      students = students.filter((s) => s.certificateStatus === "ISSUED");
    } else if (status === "not_issued") {
      students = students.filter((s) => s.certificateStatus === "NOT_ISSUED");
    }

    if (completion === "completed") {
      students = students.filter((s) => s.isCompletedProgram);
    } else if (completion === "not_completed") {
      students = students.filter((s) => !s.isCompletedProgram);
    }

    // ─────────────────────────────
    // PAGINATION
    // ─────────────────────────────
    const total = students.length;
    const start = (page - 1) * limit;

    const paginatedStudents = students.slice(start, start + limit);

    // ─────────────────────────────
    // PROGRAM OPTIONS (FOR DROPDOWN)
    // ─────────────────────────────
    const programOptions = programs.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    return NextResponse.json({
      programs: programOptions, // ✅ dropdown support
      totalStudents: total,
      page,
      totalPages: Math.ceil(total / limit),
      students: paginatedStudents,
    });
  } catch (error) {
    console.error("PROGRAM ANALYTICS ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
};
