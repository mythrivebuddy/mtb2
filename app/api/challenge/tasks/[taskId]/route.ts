// File: app/api/challenges/tasks/[taskId]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType, EnrollmentStatus } from "@prisma/client";

type EnrollmentUpdateData = {
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdate: Date;
  status?: EnrollmentStatus;
};

/**
 * Normalizes a Date object to the start of its day in UTC (00:00:00.000Z).
 * Essential for accurate date comparisons without time interference.
 */
function normalizeToUTCStartOfDay(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId: userChallengeTaskId } = params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { isCompleted, completionDate } = await request.json();

    if (typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Invalid 'isCompleted' value." }, { status: 400 });
    }
    if (!completionDate || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
      return NextResponse.json({ error: "Invalid 'completionDate'. Expected YYYY-MM-DD." }, { status: 400 });
    }

    let allTasksWereCompletedToday = false;

    await prisma.$transaction(async (tx) => {
      const taskToUpdate = await tx.userChallengeTask.findFirst({
        where: { id: userChallengeTaskId, enrollment: { userId: userId } },
        include: {
          enrollment: {
            include: {
              challenge: true,
              user: { include: { plan: true } },
            },
          },
        },
      });

      if (!taskToUpdate) {
        throw new Error("Task not found or you do not have permission to update it.");
      }

      const { enrollment } = taskToUpdate;
      const { challenge } = enrollment;

      if (challenge.status !== "ACTIVE") {
        throw new Error("This challenge is not active. Tasks can only be updated for active challenges.");
      }

      const now = new Date(); // The exact timestamp for this update
      const today = new Date(`${completionDate}T00:00:00.000Z`); // Start of the completion day in UTC
      
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1);

      const lastUpdateDate = enrollment.lastStreakUpdate
        ? normalizeToUTCStartOfDay(new Date(enrollment.lastStreakUpdate))
        : null;

      // Check if streak was broken (last update was before yesterday)
      if (enrollment.currentStreak > 0 && lastUpdateDate && lastUpdateDate < yesterday) {
        if (challenge.penalty > 0) {
          await deductJp(enrollment.user, ActivityType.CHALLENGE_PENALTY, tx, { amount: challenge.penalty });
        }
        await tx.challengeEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStreak: 0 },
        });
        enrollment.currentStreak = 0; // Update in-memory object for subsequent logic
      }

      // Update the specific task the user clicked on
      await tx.userChallengeTask.update({
        where: { id: userChallengeTaskId },
        data: {
          isCompleted: isCompleted,
          lastCompletedAt: isCompleted ? now : null, // Set to now, or clear it if unchecking
        },
      });

      if (isCompleted) {
        const allTasks = await tx.userChallengeTask.findMany({
          where: { enrollmentId: enrollment.id },
        });

        const allTasksCompleted = allTasks.every(
          (task) => (task.id === userChallengeTaskId ? isCompleted : task.isCompleted)
        );

        if (allTasksCompleted) {
          allTasksWereCompletedToday = true;
          let newStreak = enrollment.currentStreak;

          if (lastUpdateDate && lastUpdateDate.getTime() === yesterday.getTime()) {
            newStreak++; // Continue the streak
          } else if (!lastUpdateDate || lastUpdateDate.getTime() < yesterday.getTime()) {
            newStreak = 1; // Start a new streak
          }
          // Note: If lastUpdateDate is today, the streak doesn't change, which is correct.

          const dataToUpdate: EnrollmentUpdateData = {
            currentStreak: newStreak,
            longestStreak: Math.max(enrollment.longestStreak, newStreak),
            lastStreakUpdate: now,
          };

          const challengeDurationInMs = challenge.endDate.getTime() - challenge.startDate.getTime();
          const challengeDurationInDays = Math.ceil(challengeDurationInMs / (1000 * 60 * 60 * 24)) + 1; // +1 to be inclusive

          if (newStreak >= challengeDurationInDays) {
            if (challenge.reward > 0) {
              await assignJp(enrollment.user, ActivityType.CHALLENGE_REWARD, tx, { amount: challenge.reward });
            }
            dataToUpdate.status = "COMPLETED";
          }

          await tx.challengeEnrollment.update({
            where: { id: enrollment.id },
            data: dataToUpdate,
          });

          await tx.completionRecord.upsert({
            where: {
              userId_challengeId_date: {
                userId: enrollment.userId,
                challengeId: enrollment.challengeId,
                date: today,
              },
            },
            update: { status: "COMPLETED" },
            create: {
              userId: enrollment.userId,
              challengeId: enrollment.challengeId,
              date: today,
              status: "COMPLETED",
            },
          });
        }
      }
    }); // --- End of Transaction ---

    return NextResponse.json({
      message: "Task updated successfully.",
      allTasksCompleted: allTasksWereCompletedToday,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to update task:", errorMessage);

    if (errorMessage.includes("not active") || errorMessage.includes("Insufficient JP balance")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}