import { inngest } from "@/lib/inngest";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { prisma } from "@/lib/prisma";

export const alignedActionReminders = inngest.createFunction(
    { id: "aligned-action-reminders" },
    { event: "aligned-action/created" },
    async ({ event, step }) => {
        const { userId, timeFrom, timeTo } = event.data;

        // 🔔 5 min before START
        await step.sleepUntil(
            "before-start",
            new Date(new Date(timeFrom).getTime() - 5 * 60 * 1000),
        );
        const action = await prisma.alignedAction.findUnique({
            where: { id: event.data.actionId },
        });

        // ⛔ STOP if invalid
        if (!action || action.completed || new Date() > action.timeTo) {
            return;
        }

        await prisma.alignedAction.updateMany({
            where: {
                userId,
                timeFrom: new Date(timeFrom),
            },
            data: {
                activeReminder: "START",
                reminderAt: new Date(),
                popupShown: false,
            },
        });

        await notify(userId, "START");

        // 🔔 5 min before END
        await step.sleepUntil(
            "before-end",
            new Date(new Date(timeTo).getTime() - 5 * 60 * 1000),
        );
        const latestAction = await prisma.alignedAction.findUnique({
            where: { id: event.data.actionId },
        });


        if (
            !latestAction ||
            latestAction.completed ||
            new Date() > latestAction.timeTo
        ) {
            return;
        }
        await prisma.alignedAction.updateMany({
            where: {
                userId,
                timeFrom: new Date(timeFrom),
            },
            data: {
                activeReminder: "END",
                reminderAt: new Date(),
                popupShown: false,
            },
        });

        await notify(userId, "END");
    },
);

async function notify(userId: string, phase: "START" | "END") {
    await sendPushNotificationToUser(
        userId,
        "1% Start Reminder",
        phase === "START"
            ? "Your task starts in 5 minutes"
            : "Your task ends in 5 minutes",
        { url: "/dashboard/aligned-actions" },
    );
}
