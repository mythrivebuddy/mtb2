import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const challengeId = context.params.slug;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    if (!challengeId || typeof challengeId !== "string") {
      return NextResponse.json(
        { error: "A valid challenge ID is required." },
        { status: 400 }
      );
    }

    // --- THIS IS THE FIX ---
    // First, find the user's enrollment to get the ID
    const enrollmentForReset = await prisma.challengeEnrollment.findUnique({
        where: { userId_challengeId: { userId, challengeId } },
        select: { id: true }
    });

    if (enrollmentForReset) {
        // Now, run the daily reset logic for this specific enrollment
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        await prisma.userChallengeTask.updateMany({
            where: {
                enrollmentId: enrollmentForReset.id,
                isCompleted: true,
                lastCompletedAt: {
                    lt: today, // less than the start of today
                },
            },
            data: {
                isCompleted: false,
            },
        });
    }
    // --- END OF FIX ---


    // The rest of the function now fetches the newly updated data
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { currentStreak: 'desc' },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    const userEnrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      include: {
        userTasks: { orderBy: { description: 'asc' } },
      },
    });

    if (!userEnrollment) {
      return NextResponse.json({ error: "You are not enrolled in this challenge." }, { status: 403 });
    }

    const now = new Date();
    let effectiveStatus = challenge.status;
    if (effectiveStatus === "UPCOMING" && challenge.startDate <= now) {
      effectiveStatus = "ACTIVE";
    }
    if (effectiveStatus !== "COMPLETED" && challenge.endDate < now) {
      effectiveStatus = "COMPLETED";
    }

    const responseData = {
      title: challenge.title,
      description: challenge.description,
      status: effectiveStatus,
      reward: challenge.reward,
      penalty: challenge.penalty,
      participantCount: challenge.enrollments.length,
      currentStreak: userEnrollment.currentStreak,
      longestStreak: userEnrollment.longestStreak,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      dailyTasks: userEnrollment.userTasks.map(task => ({
        id: task.id,
        description: task.description,
        completed: task.isCompleted,
      })),
      leaderboard: challenge.enrollments.map((enrollment) => ({
        id: enrollment.user.id,
        name: enrollment.user.name ?? "Anonymous",
        score: enrollment.currentStreak,
        avatar:
          enrollment.user.image ||
          `https://ui-avatars.com/api/?name=${(enrollment.user.name || 'A').charAt(0)}&background=7c3aed&color=ffffff`,
      })),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`GET /api/challenge/my-challenge/${challengeId} Error:`, errorMessage);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}