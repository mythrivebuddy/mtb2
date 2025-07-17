import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    // 1. Get the current user's session
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    // 2. Fetch all of the user's enrollments
    const enrollments = await prisma.challengeEnrollment.findMany({
      where: {
        userId: userId,
      },
      // Include the full details of the challenge they are enrolled in
      include: {
        challenge: {
          // Also include the total participant count for that challenge
          include: {
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      // Order by when they joined
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // 3. Format the data to match the frontend's expected structure
    const formattedChallenges = enrollments.map(({ challenge, status }) => ({
      id: challenge.id,
      name: challenge.title,
      description: challenge.description,
      reward: challenge.reward,
      penalty: challenge.penalty,
      startDate: challenge.startDate.toISOString().split('T')[0],
      endDate: challenge.endDate.toISOString().split('T')[0],
      participants: challenge._count.enrollments,
      enrollmentStatus: status, // Include the user's personal status (IN_PROGRESS, etc.)
    }));

    return NextResponse.json(formattedChallenges);

  } catch (error) {
    console.error("GET /api/challenges/joined Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}