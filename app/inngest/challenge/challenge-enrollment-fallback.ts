import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { sendMessageForJoining } from "@/lib/utils/system-message-for-joining";

export const challengeEnrollmentFallbackJob = inngest.createFunction(
  {
    id: "challenge-enrollment-fallback",
    triggers: [{ event: "challenge-enrollment.fallback" }],
  },

  async ({ event, step }) => {
    const { userId, challengeId } = event.data as {
      userId: string;
      challengeId: string;
      orderId?: string;
    };

    await step.sleep("wait-for-enrollment", "2m");

    const enrolled = await step.run("check-enrollment-status", async () => {
      return await prisma.challengeEnrollment.findUnique({
        where: {
          userId_challengeId: { userId, challengeId },
        },
      });
    });

    if (enrolled) {
      return { status: "already_enrolled_skipping" };
    }

    const newEnrollment = await step.run(
      "create-fallback-enrollment",
      async () => {
        const templateTasks = await prisma.challengeTask.findMany({
          where: { challengeId },
        });

        return await prisma.$transaction(async (tx) => {
          const enrollment = await tx.challengeEnrollment.create({
            data: {
              userId,
              challengeId,
              status: "IN_PROGRESS",
            },
          });

          if (templateTasks.length > 0) {
            await tx.userChallengeTask.createMany({
              data: templateTasks.map((task) => ({
                description: task.description,
                enrollmentId: enrollment.id,
                templateTaskId: task.id,
              })),
            });
          }

          return enrollment;
        });
      },
    );
    await step.run("send-joining-message", async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        void sendMessageForJoining(
          challengeId,
          user.name || "Someone",
          null,
          "SYSTEM",
          userId,
        );
      }
    });
    await step.run("trigger-notification", async () => {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
      });

      if (challenge) {
        await sendPushNotificationToUser(
          userId,

          "🎉 Enrollment Successful!",
          `You're now enrolled in "${challenge.title}"`,
          {
            url: `/dashboard/challenge/my-challenges/${challenge.id}`,
          },
        );
      }
    });
    return {
      status: "fallback_enrollment_created",
      enrollmentId: newEnrollment.id,
    };
  },
);
