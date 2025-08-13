import { NextResponse} from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const now = new Date();

    // --- Update statuses before fetching ---
    await prisma.challenge.updateMany({
      where: {
        status: "UPCOMING",
        startDate: { lte: now },
      },
      data: { status: "ACTIVE" },
    });

    await prisma.challenge.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
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
        enrollments: {    // Required for JOINED filter in the UI
          select: { userId: true },
        }
      },
      orderBy: { createdAt: "desc" },
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
      _count: challenge._count
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
