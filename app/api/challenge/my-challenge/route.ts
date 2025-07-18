// app/api/challenge/my-challenge/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    // --- FIX: Access the slug property directly from context.params ---
    // This avoids the destructuring that sometimes causes the Next.js error.
    const challengeId = context.params.slug;

    if (!challengeId || typeof challengeId !== "string") {
      return NextResponse.json(
        { error: "A valid challenge ID is required." },
        { status: 400 }
      );
    }

    // Find the challenge by its 'id' using the value from the URL
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: {
            currentStreak: "desc",
          },
        },
      },
    });

    if (!challenge) {
      return new NextResponse("Challenge not found", { status: 404 });
    }

    // Fetch the current user's specific enrollment details and tasks
    const userEnrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: userId,
          challengeId: challenge.id,
        },
      },
      include: {
        userTasks: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    // Fetch the user's total JP balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { jpBalance: true },
    });

    // Format the data for the frontend
    const responseData = {
      title: challenge.title,
      status: challenge.status,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      streak: userEnrollment?.currentStreak ?? 0,
      points: user?.jpBalance ?? 0,
      dailyTasks:
        userEnrollment?.userTasks.map((task) => ({
          id: task.id,
          description: task.description,
          completed: task.isCompleted,
        })) ?? [],
      leaderboard: challenge.enrollments.map((enrollment) => ({
        id: enrollment.user.id,
        name: enrollment.user.name,
        score: enrollment.currentStreak,
        avatar:
          enrollment.user.image ||
          `https://placehold.co/40x40/7c3aed/ffffff?text=${enrollment.user.name.charAt(0)}`,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `GET /api/challenge/my-challenge Error:`,
      errorMessage,
      error
    );
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500 }
    );
  }
}
