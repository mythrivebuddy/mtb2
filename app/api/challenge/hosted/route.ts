import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Import the shared instance
import { checkRole } from "@/lib/utils/auth"; // Assuming this is your auth function

export async function GET() {
  try {
    // 1. Get the current user's session
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    // 2. Fetch all challenges where the creatorId matches the current user's ID
    const challenges = await prisma.challenge.findMany({
      where: {
        creatorId: userId,
      },
      // Include the count of enrollments to show the number of participants
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      // Order by the most recently created challenges first
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Format the data to match the frontend's expected structure
    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      name: challenge.title,
      description: challenge.description,
      reward: `${challenge.reward} JP`,
      startDate: challenge.startDate.toISOString().split('T')[0],
      endDate: challenge.endDate.toISOString().split('T')[0],
      participants: challenge._count.enrollments,
      status: challenge.status,
      mode: challenge.mode,
    }));

    return NextResponse.json(formattedChallenges);

  } catch (error) {
    console.error("GET /api/challenges/hosted Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}