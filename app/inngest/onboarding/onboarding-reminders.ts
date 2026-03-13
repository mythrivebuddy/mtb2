import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";


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
        const notification = await getCMPNotification(
            NotificationType.CMP_ONBOARDING_PENDING
        );

        if (!notification) return;

        await sendPushNotificationToUser(userId, notification.title, notification.description,
            { url: notification.url }
        );
    }
);
