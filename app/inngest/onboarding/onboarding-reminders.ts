import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";


export const onboardingReminder = inngest.createFunction(
    { id: "onboarding-reminder" },
    { event: "user.onboarding.completed" },

    async ({ event, step }) => {
        const { userId, programId } = event.data;

        await step.sleep(
            "wait-24h",
            process.env.NODE_ENV === "development" ? "20s" : "24h"
        );

        const programState = await prisma.userProgramState.findUnique({
            where: {
                userId_programId: {
                    userId,
                    programId,
                },
            },
        });

        if (!programState?.onboarded) return;

        const hasProgress = await prisma.makeoverPointsSummary.findFirst({
            where: { userId, programId },
        });

        if (hasProgress) return;

        await sendPushNotificationToUser(userId, "Start with today’s card", "CMP works one day at a time.",
            { url: "/dashboard/complete-makeover-program/todays-actions" }
        );
    }
);
