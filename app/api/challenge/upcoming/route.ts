// File: ./app/api/challenge/upcoming/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client"; // 1. Import Prisma types
import { checkRole } from "@/lib/utils/auth";

// 2. Prefix 'request' with '_' to mark it as unused
export async function GET() {
  try {
    // 1. Get the current user's session to identify them.
    const session = await checkRole("USER").catch(() => null);
    const userId = session?.user?.id;

    const now = new Date();

    // 2. Build the base query for public, upcoming challenges.
    // 3. Use the specific 'Prisma.ChallengeWhereInput' type instead of 'any'
    const whereClause: Prisma.ChallengeWhereInput = {
      mode: "PUBLIC",
      status: "UPCOMING",
      startDate: {
        gt: now, // gt = "greater than"
      },
    };

    // 3. If a user is logged in, add conditions to filter out their challenges.
    if (userId) {
      whereClause.AND = [
        // Condition A: The user is NOT the creator of the challenge.
        {
          creatorId: {
            not: userId,
          },
        },
        // Condition B: The user has NO existing enrollment for the challenge.
        {
          enrollments: {
            none: {
              userId: userId,
            },
          },
        },
      ];
    }

    // 4. Query the database using the final constructed where clause.
    const upcomingChallenges = await prisma.challenge.findMany({
      where: whereClause,
      orderBy: {
        startDate: "asc",
      },
      include: {
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