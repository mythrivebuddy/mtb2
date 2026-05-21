import { runInactivityNotifier } from "@/lib/utils/makeover-program/inactivity/inactivityNotifier";
import { NotificationType } from "@prisma/client";

export const GET = async () => {
  try {
    const result = await runInactivityNotifier({
      days: 7,
      notifiedField: "inactivity7DayNotified",
      type: NotificationType.CMP_INACTIVITY_7_DAYS,
    });

    return Response.json(result);
  } catch (error) {
    console.error("INACTIVITY 7 DAY PUSH ERROR", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};