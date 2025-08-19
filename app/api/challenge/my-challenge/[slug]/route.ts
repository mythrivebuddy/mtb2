import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// Define a clear type for the task objects to satisfy TypeScript
type Task = {
  id: string;
  description: string;
  completed: boolean;
};

/**
 * Handles GET requests to fetch the detailed data for a single challenge.
 * It intelligently provides the correct tasks based on whether the user is
 * an enrolled participant or the challenge creator.
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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all necessary data concurrently for maximum efficiency
    const [challenge, enrollment, participantCount, leaderboard, completionRecords] =
      await Promise.all([
        prisma.challenge.findUnique({
          where: { id: challengeId },
          include: {
            creator: {
              select: { name: true },
            },
          },
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
        prisma.completionRecord.findMany({
            where: {
              userId: userId,
              challengeId: challengeId,
            },
            orderBy: {
              date: 'asc'
            }
        })
      ]);

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    // This section handles the daily reset of tasks
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

        // Update the in-memory object so the response is immediately consistent
        enrollment.userTasks = enrollment.userTasks.map((task) => {
          if (tasksToReset.some((t) => t.id === task.id)) {
            return { ...task, isCompleted: false, lastCompletedAt: null };
          }
          return task;
        });
      }
    }

    // Declare dailyTasks with the explicit 'Task[]' type to fix TypeScript error
    let dailyTasks: Task[];

    if (enrollment) {
      // Case 1: The user IS enrolled. Give them their personal, trackable tasks.
      dailyTasks = (enrollment.userTasks || []).map((task) => ({
        id: task.id,
        description: task.description,
        completed: task.isCompleted,
      }));
    } else if (challenge.creatorId === userId) {
      // Case 2: User is the creator (but not enrolled). Give them the template tasks.
      const templateTasks = await prisma.challengeTask.findMany({
        where: { challengeId: challengeId },
      });
      dailyTasks = templateTasks.map((task) => ({
        id: task.id,
        description: task.description,
        completed: false, // Template tasks are not completable
      }));
    } else {
      // Case 3: User is not involved with this challenge. Send no tasks.
      dailyTasks = [];
    }
    
    // Format leaderboard and history data for the frontend
    const formattedLeaderboard = leaderboard.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name || "Anonymous",
      avatar: entry.user.image || "/default-avatar.png",
      score: entry.currentStreak,
    }));
    
    const history = (completionRecords || []).map(comp => ({
        date: comp.date.toISOString(),
        status: comp.status
    }));

    // Assemble the final, complete response payload
    const responseData = {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      currentStreak: enrollment?.currentStreak ?? 0,
      longestStreak: enrollment?.longestStreak ?? 0,
      participantCount,
      dailyTasks: dailyTasks, // This is now correctly typed
      leaderboard: formattedLeaderboard,
      history: history,
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
 * Ensures that only the creator of the challenge can delete it.
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
      `DELETE /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing challenge.
 * Ensures that only the creator of the challenge can edit it.
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

    const { title, description, reward, penalty, startDate, endDate, mode } =
      body;

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

    // Serialize date fields for a consistent JSON response
    const serializableUpdatedChallenge = {
      ...updatedChallenge,
      startDate: updatedChallenge.startDate.toISOString(),
      endDate: updatedChallenge.endDate.toISOString(),
      createdAt: updatedChallenge.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        message: "Challenge updated successfully",
        data: serializableUpdatedChallenge,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `PATCH /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}