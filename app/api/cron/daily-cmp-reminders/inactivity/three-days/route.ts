import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { runInactivityNotifier } from "@/lib/utils/makeover-program/inactivity/inactivityNotifier";


export const GET = async () => {
    try {
        const result = await runInactivityNotifier({
            days: 3,
            notifiedField: "inactivity3DayNotified",
            notification: CMP_NOTIFICATIONS.INACTIVITY_3_DAYS,
        });

        return Response.json(result);
    } catch (error) {
        console.error("INACTIVITY 3 DAY PUSH ERROR", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
