// File: app/api/challenges/tasks/[taskId]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType, EnrollmentStatus } from "@prisma/client";

// Define a type for the data used to update an enrollment
type EnrollmentUpdateData = {
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdate: Date;
  status?: EnrollmentStatus;
};

// PATCH handler
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  // const userChallengeTaskId = params.taskId;
  const {taskId} = await params;

  const userChallengeTaskId = taskId;

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

    await prisma.$transaction(async (tx) => {
      const taskToUpdate = await tx.userChallengeTask.findFirst({
        where: {
          id: userChallengeTaskId,
          enrollment: { userId },
        },
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

        await tx.challengeEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStreak: 0 },
        });

        enrollment.currentStreak = 0;
      }

      await tx.userChallengeTask.update({
        where: { id: userChallengeTaskId },
        data: {
          isCompleted,
          lastCompletedAt: isCompleted ? new Date() : undefined,
        },
      });

      if (isCompleted) {
        const allTasks = await tx.userChallengeTask.findMany({
          where: { enrollmentId: enrollment.id },
        });

        const allTasksCompleted = allTasks.every((task) => task.isCompleted);

        if (allTasksCompleted) {
          allTasksWereCompletedToday = true;
          let newStreak = enrollment.currentStreak;

          if (
            lastUpdateDate &&
            lastUpdateDate.getTime() === yesterday.getTime()
          ) {
            newStreak++;
          } else {
            newStreak = 1;
          }

          const dataToUpdate: EnrollmentUpdateData = {
            currentStreak: newStreak,
            longestStreak: Math.max(enrollment.longestStreak, newStreak),
            lastStreakUpdate: now,
          };

          const durationMs =
            challenge.endDate.getTime() - challenge.startDate.getTime();
          const challengeDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

          if (newStreak === challengeDays && challenge.reward > 0) {
            await assignJp(
              enrollment.user,
              ActivityType.CHALLENGE_REWARD,
              tx,
              { amount: challenge.reward }
            );
            dataToUpdate.status = "COMPLETED";
          }

          await tx.challengeEnrollment.update({
            where: { id: enrollment.id },
            data: dataToUpdate,
          });
        }
      }
    });

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
