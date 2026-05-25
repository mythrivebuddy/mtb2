//Todo we need to delete this api as we merge it in single api for handling both three and seven days inactivity (new /api/cron/daily-cmp-reminders/inactivity/three-or-seven-days)
import { runInactivityNotifier } from "@/lib/utils/makeover-program/inactivity/inactivityNotifier";
import { NotificationType } from "@prisma/client";

export const GET = async () => {
  try {
    const result = await runInactivityNotifier({
      days: 3,
      notifiedField: "inactivity3DayNotified",
      type: NotificationType.CMP_INACTIVITY_3_DAYS,
    });

    return Response.json(result);
  } catch (error) {
    console.error("INACTIVITY 3 DAY PUSH ERROR", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};