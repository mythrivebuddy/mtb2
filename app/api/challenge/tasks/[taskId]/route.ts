import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, context: any) {
  const userChallengeTaskId = context.params.taskId;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { isCompleted } = await request.json();
    if (typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'isCompleted' value provided." },
        { status: 400 }
      );
    }

    let allTasksWereCompletedToday = false;

    // --- Start of Transaction ---
    await prisma.$transaction(
      async (tx) => {
        // Find the task and include its parent challenge's status
        const taskToUpdate = await tx.userChallengeTask.findFirst({
          where: {
            id: userChallengeTaskId,
            enrollment: { userId: userId },
          },
          include: {
            enrollment: {
              include: {
                challenge: {
                  select: { status: true },
                },
              },
            },
          },
        });

        if (!taskToUpdate) {
          throw new Error(
            "Task not found or you do not have permission to update it."
          );
        }

        const challengeStatus = taskToUpdate.enrollment.challenge.status;
        if (challengeStatus !== "ACTIVE") {
          throw new Error(
            "This challenge is not active. Tasks can only be updated for active challenges."
          );
        }

        const { enrollmentId } = taskToUpdate;

        // Daily Reset Logic
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        await tx.userChallengeTask.updateMany({
          where: {
            enrollmentId: enrollmentId,
            isCompleted: true,
            lastCompletedAt: { lt: today },
          },
          data: { isCompleted: false },
        });

        // Update the specific task that the user clicked on
        await tx.userChallengeTask.update({
          where: { id: userChallengeTaskId },
          data: {
            isCompleted: isCompleted,
            lastCompletedAt: isCompleted ? new Date() : undefined,
          },
        });

        // Streak Calculation Logic
        if (isCompleted) {
          const allTasks = await tx.userChallengeTask.findMany({
            where: { enrollmentId: enrollmentId },
          });

          const allTasksCompleted = allTasks.every((task) => task.isCompleted);

          if (allTasksCompleted) {
            const enrollment = await tx.challengeEnrollment.findUnique({
              where: { id: enrollmentId },
            });

            if (enrollment) {
              const now = new Date();
              const lastUpdate = enrollment.lastStreakUpdate
                ? new Date(enrollment.lastStreakUpdate)
                : null;

              if (
                !lastUpdate ||
                lastUpdate.toDateString() !== now.toDateString()
              ) {
                allTasksWereCompletedToday = true;
                let newStreak = enrollment.currentStreak;

                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);

                if (
                  lastUpdate &&
                  lastUpdate.toDateString() === yesterday.toDateString()
                ) {
                  newStreak++;
                } else {
                  newStreak = 1;
                }

                await tx.challengeEnrollment.update({
                  where: { id: enrollmentId },
                  data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(
                      enrollment.longestStreak,
                      newStreak
                    ),
                    lastStreakUpdate: now,
                  },
                });
              }
            }
          }
        }
      },
      {
        // ✅ THE FIX: Add a timeout for Vercel's network latency
        maxWait: 10000,
        timeout: 20000,
      }
    ); // --- End of Transaction ---

    return NextResponse.json({
      message: "Task updated successfully.",
      allTasksCompleted: allTasksWereCompletedToday,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to update task:", errorMessage);

    if (errorMessage.includes("This challenge is not active")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
