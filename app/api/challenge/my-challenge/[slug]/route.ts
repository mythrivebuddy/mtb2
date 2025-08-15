import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

/**
 * MODIFIED: Handles GET requests to fetch the detailed data for a single challenge,
 * including the current user's enrollment status, streaks, AND their daily tasks.
 */

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

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

    // Get today's date without time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [challenge, enrollment, participantCount, leaderboard] =
      await Promise.all([
        prisma.challenge.findUnique({
          where: { id: challengeId },
        }),
        prisma.challengeEnrollment.findUnique({
          where: {
            userId_challengeId: {
              userId: userId,
              challengeId: challengeId,
            },
          },
          include: {
            userTasks: {
              select: {
                id: true,
                description: true,
                isCompleted: true,
                lastCompletedAt: true,
              },
            },
          },
        }),
        prisma.challengeEnrollment.count({
          where: { challengeId: challengeId },
        }),
        prisma.challengeEnrollment.findMany({
          where: { challengeId: challengeId },
          orderBy: { currentStreak: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        }),
      ]);

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    // Auto-reset outdated completed tasks
    if (enrollment?.userTasks?.length) {
      const tasksToReset = enrollment.userTasks.filter((task) => {
        if (task.isCompleted && task.lastCompletedAt) {
          const completedDate = new Date(
            task.lastCompletedAt.getFullYear(),
            task.lastCompletedAt.getMonth(),
            task.lastCompletedAt.getDate()
          );
          return completedDate < today;
        }
        return false;
      });

      if (tasksToReset.length > 0) {
        await prisma.userChallengeTask.updateMany({
          where: {
            id: { in: tasksToReset.map((t) => t.id) },
          },
          data: {
            isCompleted: false,
            lastCompletedAt: null,
          },
        });

        // Also reset in-memory so the response matches the DB
        enrollment.userTasks = enrollment.userTasks.map((task) => {
          if (tasksToReset.some((t) => t.id === task.id)) {
            return { ...task, isCompleted: false, lastCompletedAt: null };
          }
          return task;
        });
      }
    }

    const formattedLeaderboard = leaderboard.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name || "Anonymous",
      avatar: entry.user.image || "/default-avatar.png",
      score: entry.currentStreak,
    }));

    const responseData = {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      currentStreak: enrollment?.currentStreak ?? 0,
      longestStreak: enrollment?.longestStreak ?? 0,
      participantCount,
      dailyTasks: (enrollment?.userTasks || []).map((task) => ({
        id: task.id,
        description: task.description,
        completed: task.isCompleted,
      })),
      leaderboard: formattedLeaderboard,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `GET /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage
    );
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}


/**
 * Handles DELETE requests to remove a challenge.
 * (This function remains unchanged)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete challenges you created" },
        { status: 403 }
      );
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    return NextResponse.json(
      { message: "Challenge deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      "DELETE /api/challenge/my-challenge/${challengeId} Error:",
      errorMessage,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing challenge.
 * (This function remains unchanged)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const challengeToUpdate = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });

    if (!challengeToUpdate) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challengeToUpdate.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit challenges you created" },
        { status: 403 }
      );
    }

    const {
        title,
        description,
        reward,
        penalty,
        startDate,
        endDate,
        mode
    } = body;

    const updateData = {
      title,
      description,
      reward,
      penalty,
      mode,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });

    const serializableUpdatedChallenge = {
        ...updatedChallenge,
        startDate: updatedChallenge.startDate.toISOString(),
        endDate: updatedChallenge.endDate.toISOString(),
        createdAt: updatedChallenge.createdAt.toISOString(),
    };

    return NextResponse.json(
      { message: "Challenge updated successfully", data: serializableUpdatedChallenge },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
    "  PATCH /api/challenge/my-challenge/${challengeId} Error:",
      errorMessage,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}