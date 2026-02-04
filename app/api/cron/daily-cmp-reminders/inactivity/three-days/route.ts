import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { runInactivityNotifier } from "@/lib/utils/makeover-program/inactivity/inactivityNotifier";
import { NotificationType } from "@prisma/client";


export const GET = async () => {
    try {
        const notification = await getCMPNotification(
            NotificationType.CMP_INACTIVITY_3_DAYS
        );

        if (!notification) {
            return Response.json({
                skipped: true,
                reason: "notification template missing for three days inactivity",
            });
        }
        const result = await runInactivityNotifier({
            days: 3,
            notifiedField: "inactivity3DayNotified",
            notification,
        });

        return Response.json(result);
    } catch (error) {
        console.error("INACTIVITY 3 DAY PUSH ERROR", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
