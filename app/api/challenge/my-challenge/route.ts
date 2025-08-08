// File: app/api/challenges/my-challenges/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const now = new Date();
    // --- FIX: Define 'today' as the start of the current calendar day ---
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Step 1: Find all UPCOMING challenges that should now be ACTIVE
    await prisma.challenge.updateMany({
      where: {
        status: "UPCOMING",
        startDate: {
          lte: now, // This is correct: a challenge can start anytime during the day
        },
      },
      data: {
        status: "ACTIVE",
      },
    });

    // Step 2: Find all ACTIVE challenges that should now be COMPLETED
    await prisma.challenge.updateMany({
      where: {
        status: "ACTIVE",
        // --- FIX: Compare against the start of today, not the exact time ---
        endDate: {
          lt: today, // A challenge is completed only if its end date was before today
        },
      },
      data: {
        status: "COMPLETED",
      },
    });

    // The original logic now runs on the updated data
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "hosted" or "joined"

    if (!type || (type !== "hosted" && type !== "joined")) {
      return new NextResponse(
        JSON.stringify({
          error: "A valid 'type' query parameter is required.",
        }),
        { status: 400 }
      );
    }

    let whereClause;

    if (type === "hosted") {
      whereClause = { creatorId: userId };
    } else {
      // type === 'joined'
      whereClause = {
        enrollments: {
          some: { userId: userId },
        },
        creatorId: {
          not: userId,
        },
      };
    }

    const challengesFromDb = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { enrollments: true },
        },
        enrollments:
          type === "joined"
            ? {
                where: { userId: userId },
                select: { status: true },
              }
            : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const processedChallenges = challengesFromDb.map((challenge) => {
      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        penalty: challenge.penalty,
        startDate: challenge.startDate.toISOString().split("T")[0],
        endDate: challenge.endDate.toISOString().split("T")[0],
        participants: challenge._count.enrollments,
        status: challenge.status,
        mode: challenge.mode,
        enrollmentStatus:
          type === "joined" ? challenge.enrollments[0]?.status : undefined,
      };
    });

    return new NextResponse(JSON.stringify(processedChallenges), {
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      "GET /api/challenges/my-challenges Error:",
      errorMessage,
      error
    );
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500 }
    );
  }
}