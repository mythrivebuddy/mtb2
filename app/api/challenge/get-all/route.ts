import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Start of today (no time part)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Yesterday's date (start of that day)
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);

    // --- Update statuses before fetching ---
    // Upcoming → Active if start date is today or earlier
    await prisma.challenge.updateMany({
      where: {
        status: "UPCOMING",
        startDate: { lte: now },
      },
      data: { status: "ACTIVE" },
    });

    // Active → Completed if end date was before today (so today’s are still active)
    await prisma.challenge.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: yesterday },
      },
      data: { status: "COMPLETED" },
    });

    // --- Fetch all challenges ---
    const challengesFromDb = await prisma.challenge.findMany({
      include: {
        _count: {
          select: { enrollments: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        enrollments: {
          // Required for JOINED filter in the UI
          select: { userId: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // --- Format data for client ---
    const processedChallenges = challengesFromDb.map((challenge) => ({
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
      creator: challenge.creator,
      creatorName: challenge.creator.name,
      enrollments: challenge.enrollments,
      _count: challenge._count,
    }));

    return new NextResponse(JSON.stringify(processedChallenges), { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`GET /api/challenge/get-all Error:`, errorMessage, error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500 }
    );
  }
}
