import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export const alignedActionSnooze = inngest.createFunction(
    { id: "aligned-action-snooze" },
    { event: "aligned-action/snooze" },
    async ({ event, step }) => {
        const { actionId, snoozedUntill } = event.data;

        await step.sleepUntil("snooze-until", new Date(snoozedUntill));

        const action = await prisma.alignedAction.findUnique({
            where: { id: actionId },
        });

        // ⛔ Kill old / invalid runs
        if (
            !action ||
            action.completed ||
            !action.snoozedUntill ||
            action.snoozedUntill.getTime() !== new Date(snoozedUntill).getTime()
        ) {
            return;
        }

        await prisma.alignedAction.update({
            where: { id: actionId },
            data: {
                activeReminder: "START",
                reminderAt: new Date(),
                popupShown: false,
            },
        });
        await sendPushNotificationToUser(
            action.userId,
            "Aligned Action Reminder",
            "Here’s your reminder again 👋",
            { url: "/dashboard/aligned-actions" }
        );
    }
);

