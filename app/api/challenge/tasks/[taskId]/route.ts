// File: app/api/challenges/tasks/[taskId]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp"; // Ensure assignJp is imported
import { ActivityType, EnrollmentStatus } from "@prisma/client";

// Define a type for the data used to update an enrollment
type EnrollmentUpdateData = {
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdate: Date;
  status?: EnrollmentStatus; // Status is optional
};

// This function handles PATCH requests to update a specific task's completion status.
// e.g., PATCH /api/challenges/tasks/some-task-id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } } // <-- CORRECTED: Destructure params directly
) {
  const userChallengeTaskId = params.taskId; // <-- CORRECTED: Access taskId from params

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

    // A transaction ensures all database operations (streak, penalty, reward) succeed or fail together.
    await prisma.$transaction(async (tx) => {
      // Find the specific task the user is updating and include related data.
      const taskToUpdate = await tx.userChallengeTask.findFirst({
        where: {
          id: userChallengeTaskId,
          enrollment: { userId: userId },
        },
        include: {
          enrollment: {
            include: {
              challenge: true, // Needed for penalty and reward amounts
              user: { include: { plan: true } }, // Needed for JP functions
            },
          },
        },
      });

      if (!taskToUpdate) {
        throw new Error(
          "Task not found or you do not have permission to update it."
        );
      }

      const { enrollment } = taskToUpdate;
      const { challenge } = enrollment;

      if (challenge.status !== "ACTIVE") {
        throw new Error(
          "This challenge is not active. Tasks can only be updated for active challenges."
        );
      }

      // --- Penalty and Streak Reset Logic ---
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const lastUpdate = enrollment.lastStreakUpdate
        ? new Date(enrollment.lastStreakUpdate)
        : null;
      const lastUpdateDate = lastUpdate
        ? new Date(
            lastUpdate.getFullYear(),
            lastUpdate.getMonth(),
            lastUpdate.getDate()
          )
        : null;

      // Check if the streak was broken (i.e., the last update was before yesterday)
      if (
        enrollment.currentStreak > 0 &&
        lastUpdateDate &&
        lastUpdateDate < yesterday
      ) {
        if (challenge.penalty > 0) {
          await deductJp(
            enrollment.user,
            ActivityType.CHALLENGE_PENALTY,
            tx,
            { amount: challenge.penalty }
          );
        }
        // Reset the streak to 0
        await tx.challengeEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStreak: 0 },
        });
        enrollment.currentStreak = 0; // Update in-memory object
      }
      
      // Update the specific task the user clicked on
      await tx.userChallengeTask.update({
        where: { id: userChallengeTaskId },
        data: {
          isCompleted: isCompleted,
          lastCompletedAt: isCompleted ? new Date() : undefined,
        },
      });

      // --- Streak and Reward Calculation Logic ---
      // This block only runs if a task is being marked as complete.
      if (isCompleted) {
        const allTasks = await tx.userChallengeTask.findMany({
          where: { enrollmentId: enrollment.id },
        });

        const allTasksCompleted = allTasks.every((task) => task.isCompleted);

        // If all of today's tasks are now complete...
        if (allTasksCompleted) {
          allTasksWereCompletedToday = true;
          let newStreak = enrollment.currentStreak;

          // If the last update was yesterday, continue the streak. Otherwise, start a new one.
          if (lastUpdateDate && lastUpdateDate.getTime() === yesterday.getTime()) {
            newStreak++;
          } else {
            newStreak = 1;
          }
          
          // Use the specific type for the update payload
          const dataToUpdate: EnrollmentUpdateData = {
              currentStreak: newStreak,
              longestStreak: Math.max(enrollment.longestStreak, newStreak),
              lastStreakUpdate: now,
          };

          // --- THIS IS THE REWARD LOGIC ---
          // Calculate the total duration of the challenge in days.
          const challengeDurationInMs = challenge.endDate.getTime() - challenge.startDate.getTime();
          const challengeDurationInDays = Math.ceil(challengeDurationInMs / (1000 * 60 * 60 * 24));

          // If the new streak matches the challenge's total duration, the user has won.
          if (newStreak === challengeDurationInDays) {
              // Assign the reward points if the reward is greater than 0.
              if (challenge.reward > 0) {
                  await assignJp(enrollment.user, ActivityType.CHALLENGE_REWARD, tx, { amount: challenge.reward });
              }
              // Mark the user's enrollment as 'COMPLETED'.
              dataToUpdate.status = "COMPLETED";
          }
          // --- END OF REWARD LOGIC ---

          // Update the enrollment with the new streak and possibly completed status.
          await tx.challengeEnrollment.update({
            where: { id: enrollment.id },
            data: dataToUpdate,
          });
        }
      }
    }); // --- End of Transaction ---

    return NextResponse.json({
      message: "Task updated successfully.",
      allTasksCompleted: allTasksWereCompletedToday,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to update task:", errorMessage);

    if (
      errorMessage.includes("not active") ||
      errorMessage.includes("Insufficient JP balance")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
