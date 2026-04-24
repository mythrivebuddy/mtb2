// /api/user/dashboard-content
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const GET = async (req: Request) => {
  try {
    const session = await checkRole("USER");

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const program = await prisma.program.findFirst({
      where: { slug: "2026-complete-makeover" },
      include: {
        plans: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 },
      );
    }

    const userMakeoverCommitment = await prisma.userMakeoverCommitment.findMany(
      {
        where: {
          userId: session.user.id,
          programId: program.id,
        },
        include: {
          area: {
            select: { id: true, name: true },
          },
        },
      },
    );

    // ✅ USE FRONTEND TIME
    const alignedAction = await prisma.alignedAction.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
      select: {
        id: true,
        completed: true,
        selectedTask: true,
        tasks: true,
        timeFrom: true,
        timeTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 👉 start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 👉 end of today
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1️⃣ Check today's blooms
    const todaysBlooms = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: "desc", // latest first
      },
      take: 3,
    });

    // 2️⃣ If today's exist → return them
    let dailyBlooms = todaysBlooms;

    if (todaysBlooms.length === 0) {
      // 3️⃣ Otherwise fetch overdue (oldest first)
      dailyBlooms = await prisma.todo.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            lt: startOfDay, // before today
          },
          isCompleted: false,
        },
        orderBy: {
          createdAt: "asc", // oldest first
        },
        take: 3,
      });
    }

    const onePercentProgressVault = await prisma.progressVault.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
    });
    const miracleLogs = await prisma.miracleLog.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
    });

    const challenges = await prisma.challengeEnrollment.findMany({
      where: {
        userId: session.user.id,
        challenge: {
          status: "ACTIVE",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          joinMode: "MANUAL",
        },
      },
      orderBy: [
        {
          challenge: {
            challengeJoiningType: "desc", // ✅ PAID first
          },
        },
        {
          joinedAt: "desc",
        },
      ],
      take: 3, // ✅ only 3
      select: {
        challenge: {
          select: {
            id: true,
            title: true,
            challengeJoiningType: true,
          },
        },
      },
    });
    const mmpPrograms = await prisma.userProgramState.findMany({
      where: {
        userId: session.user.id,
        program: {
          status: "PUBLISHED",
          isActive: true,
          modules: { not: Prisma.JsonNull }, // ✅ only MMP
          slug: { not: "2026-complete-makeover" }, // ❌ exclude
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3, // optional (like challenges)
      select: {
        program: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,

        // ✅ only future OR ongoing events
        OR: [
          {
            end: {
              gte: now, // still relevant (ongoing or future)
            },
          },
        ],
      },

      orderBy: {
        start: "asc", // nearest first
      },

      take: 1, // ✅ only ONE needed
    });
    const selectedEvent = events[0] || null;
    const eventData = selectedEvent
      ? {
          ...selectedEvent,

          isCompletedByTime: selectedEvent.end
            ? new Date(selectedEvent.end) < now
            : false,

          isOngoing:
            selectedEvent.start && selectedEvent.end
              ? new Date(selectedEvent.start) <= now &&
                new Date(selectedEvent.end) >= now
              : false,
        }
      : null;

    const accountabilityHubGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3, // same pattern as challenges/mmp
      select: {
        id: true,
        name: true,
      },
    });
    console.log({accountabilityHubGroups});
    
    return NextResponse.json(
      {
        userMakeoverCommitment,
        alignedAction,
        dailyBlooms,
        onePercentProgressVault,
        miracleLogs,
        challenges,

        mmpPrograms,
        event: eventData,
        accountabilityHubGroups,
        cmpProgramId: program.plans[0].id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 },
    );
  }
};
