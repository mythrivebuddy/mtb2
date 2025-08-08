// File: ./app/api/challenge/upcoming/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    const session = await checkRole("USER").catch(() => null);
    const userId = session?.user?.id;
    const now = new Date();

    // --- CHANGE #1: Simplify the main query ---
    // We only filter for PUBLIC challenges now.
    // The specific status (upcoming, active, etc.) will be calculated later.
    const whereClause: Prisma.ChallengeWhereInput = {
      mode: "PUBLIC",
    };

    // This part remains the same: If a user is logged in,
    // we still filter out challenges they've created or joined.
    if (userId) {
      whereClause.AND = [
        { creatorId: { not: userId } },
        { enrollments: { none: { userId: userId } } },
      ];
    }

    // The database query now fetches ALL public challenges that aren't the user's.
    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      orderBy: {
        startDate: "asc",
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    // --- CHANGE #2: Dynamically calculate the status for each challenge ---
    const challengesWithStatus = challenges.map((challenge) => {
      let status: "UPCOMING" | "ACTIVE" | "COMPLETED" = "COMPLETED";

      if (now < challenge.startDate) {
        status = "UPCOMING";
      } else if (now >= challenge.startDate && now <= challenge.endDate) {
        status = "ACTIVE";
      }
      
      return {
        ...challenge,
        status: status, // Add the correct status to the object
      };
    });

    // Return the full list of challenges with their correct statuses.
    return NextResponse.json(challengesWithStatus, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch challenges:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}