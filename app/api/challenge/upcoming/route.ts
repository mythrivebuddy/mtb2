import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const now = new Date();

    // Query the database for challenges that meet the updated criteria.
    const upcomingChallenges = await prisma.challenge.findMany({
      where: {
        mode: "PUBLIC",
        status: "UPCOMING",
        
        // ✅ THE KEY CHANGE IS HERE:
        // Only fetch challenges where the start date is "greater than" the current time.
        // This ensures that challenges whose start time has passed are not included,
        // effectively treating them as "ACTIVE" without changing the database.
        startDate: {
          gt: now, // gt = "greater than"
        },
      },
      orderBy: {
        // Show the challenges that are starting soonest first.
        startDate: "asc",
      },
      include: {
        // Include the count of enrollments for each challenge.
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Return the correctly filtered list of challenges.
    return NextResponse.json(upcomingChallenges, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch upcoming challenges:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
