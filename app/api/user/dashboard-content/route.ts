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
        isFromEvent: false,
        isCompleted: false,
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
          isFromEvent: false,
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

    // 1️⃣ First: Upcoming + Ongoing events
    let selectedEvents = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        isFromEvent: true,
        isCompleted: false,
        dueDate: {
          gte: now, // ✅ upcoming
        },
      },
      orderBy: {
        dueDate: "asc", // earliest first
      },
      take: 3,
    });

    // 2️⃣ If none → include ongoing events that already started today
    if (selectedEvents.length === 0) {
      selectedEvents = await prisma.todo.findMany({
        where: {
          userId: session.user.id,
          isFromEvent: true,
          isCompleted: false,
          dueDate: {
            gte: startOfDay, // started today
            lt: now, // but already passed start → ongoing/just passed
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 3,
      });
    }

    // 3️⃣ If still none → fallback to overdue
    // if (selectedEvents.length === 0) {
    //   selectedEvents = await prisma.todo.findMany({
    //     where: {
    //       userId: session.user.id,
    //       isFromEvent: true,
    //       isCompleted: false,
    //       dueDate: {
    //         lt: startOfDay, // ❗ strictly overdue (before today)
    //       },
    //     },
    //     orderBy: {
    //       dueDate: "asc", // oldest overdue first
    //     },
    //     take: 3,
    //   });
    // }

    // 3. Map the data with time-based status flags
    const eventData = selectedEvents.map((event) => ({
      ...event,
      isCompletedByTime: event.dueDate ? new Date(event.dueDate) < now : false,

      isOngoing:
        event.dueDate && event.endTime
          ? new Date(event.dueDate) <= now &&
            new Date(
              `${event.dueDate.toISOString().split("T")[0]}T${event.endTime}:00`,
            ) >= now
          : false,
    }));

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

    return NextResponse.json(
      {
        userMakeoverCommitment,
        alignedAction,
        dailyBlooms,
        onePercentProgressVault,
        miracleLogs,
        challenges,

        mmpPrograms,
        events: eventData,
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
