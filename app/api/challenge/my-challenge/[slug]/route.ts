import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { z } from "zod";


export const dynamic = 'force-dynamic';

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


    let dailyTasks: Task[];

    if (enrollment) {
  // Case 1: The user IS enrolled (whether they are the creator or not).
  // Give them their personal, trackable tasks so they can complete them.
  dailyTasks = (enrollment.userTasks || []).map((task) => ({
    id: task.id,            // ✅ Correct: This is the userChallengeTask.id
    description: task.description,
    completed: task.isCompleted,
  }));
} else {
  // Case 2: The user is NOT enrolled.
  // They have no personal tasks to complete. Sending an empty array is the correct behavior
  // for a "my-challenges" page, even if they are the creator.
  dailyTasks = [];
}

    // // --- THIS IS THE CORRECTED LOGIC ---
    // // We now check if the user is the creator FIRST.
    // if (challenge.creatorId === userId) {
    //   // Case 1 (PRIORITY): User is the creator. ALWAYS give them the template tasks to edit.
    //   const templateTasks = await prisma.challengeTask.findMany({
    //     where: { challengeId: challengeId },
    //   });
    //   dailyTasks = templateTasks.map((task) => ({
    //    id: task.id,
    //     description: task.description,
    //     completed: false, // Template tasks are not completable
    //   }));
    // } else if (enrollment) {
    //   // Case 2: The user is just an enrolled participant. Give them their personal, trackable tasks.
    //   dailyTasks = (enrollment.userTasks || []).map((task) => ({
    //     id: task.id,
    //     description: task.description,
    //     completed: task.isCompleted,
    //   }));
    // } else {
    //   // Case 3: User is not involved with this challenge. Send no tasks.
    //   dailyTasks = [];
    // }




    // Format leaderboard and history data for the frontend
    const formattedLeaderboard = leaderboard.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name || "Anonymous",
      avatar: entry.user.image || "",
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

    // Use a transaction for safe, atomic deletion of all related records
    await prisma.$transaction([
      prisma.completionRecord.deleteMany({ where: { challengeId } }),
      //prisma.userChallengeTask.deleteMany({ where: { challengeTask: { challengeId } } }),
      prisma.userChallengeTask.deleteMany({ where: { enrollment: { challengeId } } }),
      prisma.challengeTask.deleteMany({ where: { challengeId } }),
      prisma.challengeEnrollment.deleteMany({ where: { challengeId } }),
      prisma.challenge.delete({ where: { id: challengeId } }),
    ]);

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


//   request: NextRequest,
//   context: { params: { slug: string } }
// ) {
//   const { slug: challengeId } = context.params;

//   try {
//     const session = await checkRole("USER");
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await request.json();

//     if (!challengeId) {
//       return NextResponse.json(
//         { error: "Challenge ID is required" },
//         { status: 400 }
//       );
//     }

//     const challengeToUpdate = await prisma.challenge.findUnique({
//       where: { id: challengeId },
//       select: { creatorId: true },
//     });

//     if (!challengeToUpdate) {
//       return NextResponse.json(
//         { error: "Challenge not found" },
//         { status: 404 }
//       );
//     }

//     if (challengeToUpdate.creatorId !== session.user.id) {
//       return NextResponse.json(
//         { error: "Forbidden: You can only edit challenges you created" },
//         { status: 403 }
//       );
//     }

//     const { title, description, reward, penalty, startDate, endDate, mode } =
//       body;

//     const updateData = {
//       title,
//       description,
//       reward,
//       penalty,
//       mode,
//       startDate: startDate ? new Date(startDate) : undefined,
//       endDate: endDate ? new Date(endDate) : undefined,
//     };

//     const updatedChallenge = await prisma.challenge.update({
//       where: { id: challengeId },
//       data: updateData,
//     });

//     // Serialize date fields for a consistent JSON response
//     const serializableUpdatedChallenge = {
//       ...updatedChallenge,
//       startDate: updatedChallenge.startDate.toISOString(),
//       endDate: updatedChallenge.endDate.toISOString(),
//       createdAt: updatedChallenge.createdAt.toISOString(),
//     };

//     return NextResponse.json(
//       {
//         message: "Challenge updated successfully",
//         data: serializableUpdatedChallenge,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : "An unknown error occurred";
//     console.error(
//       `PATCH /api/challenge/my-challenge/${challengeId} Error:`,
//       errorMessage
//     );
//     return NextResponse.json(
//       { error: "Internal Server Error", details: errorMessage },
//       { status: 500 }
//     );
//   }
// }

// Zod schema for input validation, including tasks
const updateChallengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").optional(),
  description: z.string().optional().nullable(),
  tasks: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, "Task description cannot be empty"),
    })
  ).optional(),
}).strict();

/**
 * Handles PATCH requests to update an existing challenge, including its tasks.
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

    const challengeToUpdate = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });

    if (!challengeToUpdate) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    if (challengeToUpdate.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateChallengeSchema.parse(body);

    const { title, description, tasks } = validatedData;

    await prisma.$transaction(async (tx) => {
      // 1. Update the basic challenge details
      await tx.challenge.update({
        where: { id: challengeId },
        data: { title, description },
      });

      // 2. If tasks were included in the request, process them
      if (tasks) {
        const existingTasks = await tx.challengeTask.findMany({
          where: { challengeId },
          select: { id: true },
        });
        const existingTaskIds = existingTasks.map(t => t.id);
        const incomingTaskIds = tasks.map(t => t.id).filter(Boolean) as string[];

        // Find and delete tasks that are no longer in the list
        const tasksToDelete = existingTaskIds.filter(id => !incomingTaskIds.includes(id));
        if (tasksToDelete.length > 0) {
          await tx.challengeTask.deleteMany({
            where: { id: { in: tasksToDelete } },
          });
        }

        // Update tasks that have an ID
        const tasksToUpdate = tasks.filter(t => t.id);
        for (const task of tasksToUpdate) {
          await tx.challengeTask.update({
            where: { id: task.id },
            data: { description: task.description },
          });
        }

        // Create new tasks that don't have an ID
        const tasksToCreate = tasks.filter(t => !t.id);
        if (tasksToCreate.length > 0) {
          await tx.challengeTask.createMany({
            data: tasksToCreate.map(t => ({
              challengeId,
              description: t.description,
            })),
          });
        }
      }
    });

    return NextResponse.json({ message: "Challenge updated successfully" }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`PATCH /api/challenge/my-challenge/${challengeId} Error:`, errorMessage);
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}