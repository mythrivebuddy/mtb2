import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth"; // Assuming you have this for auth

export async function GET(request: Request) {
  try {
    // 1. Authenticate the user to get their ID
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get the desired type from the URL (e.g., ...?type=hosted)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "hosted" or "joined"

    if (!type || (type !== "hosted" && type !== "joined")) {
      return new NextResponse(JSON.stringify({ error: "A valid 'type' query parameter (hosted or joined) is required." }), { status: 400 });
    }

    // 3. Build the database query based on the type
    const whereClause =
      type === "hosted"
        ? { creatorId: userId } // Fetch challenges created by the user
        : { enrollments: { some: { userId } } }; // Fetch challenges the user is enrolled in

    const challengesFromDb = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { enrollments: true },
        },
        // If fetching joined challenges, also get the user's specific enrollment status
        enrollments: type === 'joined' ? {
          where: { userId: userId },
          select: { status: true }
        } : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Process the results to calculate the effective status and match frontend format
    const now = new Date();
    const processedChallenges = challengesFromDb.map((challenge) => {
      let effectiveStatus = challenge.status;

      // Logic to dynamically determine status based on dates
      if (effectiveStatus === "UPCOMING" && challenge.startDate <= now) {
        effectiveStatus = "ACTIVE";
      }
      if (effectiveStatus !== "COMPLETED" && challenge.endDate < now) {
        effectiveStatus = "COMPLETED";
      }

      return {
        id: challenge.id,
        name: challenge.title, // Map title to name for the frontend
        description: challenge.description,
        reward: challenge.reward,
        penalty: challenge.penalty,
        startDate: challenge.startDate.toISOString().split('T')[0], // Format date
        endDate: challenge.endDate.toISOString().split('T')[0],   // Format date
        participants: challenge._count.enrollments, // Map count
        status: effectiveStatus,
        mode: challenge.mode,
        // Include the user's personal enrollment status if it's a joined challenge
        enrollmentStatus: type === 'joined' ? challenge.enrollments[0]?.status : undefined,
      };
    });

    return new NextResponse(JSON.stringify(processedChallenges), { status: 200 });

  } catch (error) {
    console.error("Failed to fetch user challenges:", error);
    return new NextResponse(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
  }
}