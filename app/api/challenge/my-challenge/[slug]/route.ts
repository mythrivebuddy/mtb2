import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { z } from "zod";


export const dynamic = 'force-dynamic';

// Define a clear type for the task objects to satisfy TypeScript

type Task = {
  id: string;            // ALWAYS userChallengeTask.id
  description: string;
  completed: boolean;
};

// app/api/challenge/my-challenge/[slug]/route.ts


export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = await context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const userId = session.user.id;

    if (!challengeId) {
      return NextResponse.json({ error: "A valid challenge ID is required." }, { status: 400 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Basic fetch
    const [challenge, existingEnrollment] = await Promise.all([
      prisma.challenge.findUnique({
        where: { id: challengeId },
        include: { creator: { select: { name: true } } },
      }),
      prisma.challengeEnrollment.findUnique({
        where: { userId_challengeId: { userId, challengeId } },
        include: {
          userTasks: {
            select: { id: true, description: true, isCompleted: true, lastCompletedAt: true, templateTaskId: true },
          },
        },
      }),
    ]);
    if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });

    // Ensure creator is enrolled + has user task instances
    let enrollment = existingEnrollment;
    if (!enrollment && challenge.creatorId === userId) {
      enrollment = await prisma.$transaction(async (tx) => {
        const e = await tx.challengeEnrollment.create({
          data: { userId, challengeId },
        });

        const templates = await tx.challengeTask.findMany({ where: { challengeId } });
        if (templates.length) {
          await tx.userChallengeTask.createMany({
            data: templates.map((t) => ({
              enrollmentId: e.id,
              templateTaskId: t.id,
              description: t.description,
            })),
          });
        }

        return await tx.challengeEnrollment.findUnique({
          where: { userId_challengeId: { userId, challengeId } },
          include: {
            userTasks: {
              select: { id: true, description: true, isCompleted: true, lastCompletedAt: true, templateTaskId: true },
            },
          },
        });
      });
    }

    // Topline bits
    const [participantCount, leaderboard, completionRecords] = await Promise.all([
      prisma.challengeEnrollment.count({ where: { challengeId } }),
      prisma.challengeEnrollment.findMany({
        where: { challengeId },
        orderBy: { currentStreak: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      prisma.completionRecord.findMany({
        where: { userId, challengeId },
        orderBy: { date: "asc" },
      }),
    ]);

    // Daily reset for this user
    if (enrollment?.userTasks?.length) {
      const tasksToReset = enrollment.userTasks.filter((task) => {
        if (task.isCompleted && task.lastCompletedAt) {
          const d = new Date(task.lastCompletedAt.getFullYear(), task.lastCompletedAt.getMonth(), task.lastCompletedAt.getDate());
          return d < today;
        }
        return false;
      });

      if (tasksToReset.length) {
        await prisma.userChallengeTask.updateMany({
          where: { id: { in: tasksToReset.map((t) => t.id) } },
          data: { isCompleted: false, lastCompletedAt: null },
        });
        enrollment.userTasks = enrollment.userTasks.map((task) =>
          tasksToReset.some((t) => t.id === task.id) ? { ...task, isCompleted: false, lastCompletedAt: null } : task
        );
      }
    }

    // ALWAYS return user task instances (creator included)
    let dailyTasks: Task[] = [];
    if (enrollment) {
      dailyTasks = (enrollment.userTasks || []).map((t) => ({
        id: t.id, // userChallengeTask.id
        description: t.description,
         templateTaskId: t.templateTaskId, 
        completed: t.isCompleted,
      }));
    }

    // Completed days per user for leaderboard
    const completedRecords = await prisma.completionRecord.groupBy({
      by: ["userId"],
      where: { challengeId },
      _count: { id: true },
    });
    const completedDaysMap = new Map(completedRecords.map((rec) => [rec.userId, rec._count.id]));

    const formattedLeaderboard = leaderboard.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name || "Anonymous",
      avatar: entry.user.image || "",
      score: entry.currentStreak,
      completedDays: completedDaysMap.get(entry.user.id) || 0,
    }));

    const history = (completionRecords || []).map((c) => ({
      date: c.date.toISOString(),
      status: c.status,
    }));

    const responseData = {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      currentStreak: enrollment?.currentStreak ?? 0,
      longestStreak: enrollment?.longestStreak ?? 0,
      participantCount,
      dailyTasks,
      leaderboard: formattedLeaderboard,
      history,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`GET /api/challenge/my-challenge/${challengeId} Error:`, msg);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
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


// app/api/challenge/my-challenge/[slug]/route.ts (PATCH)


const updateChallengeSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  tasks: z.array(z.object({
    id: z.string().optional(),          // templateTaskId if existing
    description: z.string().min(1),
  })).optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (challenge.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, description, tasks } = updateChallengeSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      // Update base fields
      await tx.challenge.update({
        where: { id: challengeId },
        data: { title, description },
      });

      if (!tasks) return;

      // Current templates
      const dbTemplates = await tx.challengeTask.findMany({
        where: { challengeId },
        select: { id: true, description: true },
      });
      const dbMap = new Map(dbTemplates.map((t) => [t.id, t.description]));

      // 1) Update existing templates + propagate text to user instances
      const updates = tasks.filter((t) => t.id && dbMap.has(t.id));
      for (const t of updates) {
        await tx.challengeTask.update({
          where: { id: t.id! },
          data: { description: t.description },
        });
        await tx.userChallengeTask.updateMany({
          where: { templateTaskId: t.id! },
          data: { description: t.description },
        });
      }

      // 2) Create new templates + user instances for ALL enrollments
      const creates = tasks.filter((t) => !t.id);
      if (creates.length) {
        for (const c of creates) {
          const newTpl = await tx.challengeTask.create({
            data: { challengeId, description: c.description },
          });

          const enrollments = await tx.challengeEnrollment.findMany({
            where: { challengeId },
            select: { id: true },
          });

          if (enrollments.length) {
            await tx.userChallengeTask.createMany({
              data: enrollments.map((e) => ({
                enrollmentId: e.id,
                templateTaskId: newTpl.id,
                description: newTpl.description,
              })),
            });
          }
        }
      }

      // 3) (No deletes) — Intentionally do NOT remove templates to avoid cascading user deletions
    });

    return NextResponse.json({ message: "Challenge updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("PATCH ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Internal Server Error", details: msg }, { status: 500 });
  }
}
