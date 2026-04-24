// /inngest/functions/programReminder.ts

import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { DateTime } from "luxon";

function getNext10AM(timezone: string) {
  const now = DateTime.now().setZone(timezone);
  const today10AM = now.startOf("day").plus({ hours: 10 });

  if (now < today10AM) return today10AM.toJSDate();
  return today10AM.plus({ days: 1 }).toJSDate();
}

export const mmpProgramReminder = inngest.createFunction(
  {
    id: "mmp-program-daily-reminder",
    triggers: [{ event: "mmp-program/reminder.start" }],
  },

  async ({ event, step }) => {
    const { userId, timezone } = event.data;

    /**
     * 1️⃣ GET ALL ACTIVE PROGRAMS
     */
    const activePrograms = await step.run("get-active-programs", async () => {
      return prisma.userProgramState.findMany({
        where: {
          userId,
          onboarded: true,
        },
        select: {
          programId: true,
          onboardedAt: true,
        },
      });
    });

    if (!activePrograms.length) {
      console.log("❌ No active programs → STOP WORKFLOW");
      return; // ⛔ stops recursion permanently
    }

    /**
     * 2️⃣ FETCH PROGRAMS (OPTIMIZED - SINGLE QUERY)
     * Exclude CMP program here
     */
    const programs = await step.run("get-programs", async () => {
      return prisma.program.findMany({
        where: {
          id: { in: activePrograms.map((p) => p.programId) },
          slug: {
            not: "2026-complete-makeover",
          },
        },
        select: {
          id: true,
          durationDays: true,
          name: true,
        },
      });
    });

    const programMap = new Map(programs.map((p) => [p.id, p]));

    /**
     * 3️⃣ FILTER VALID (NOT EXPIRED)
     */
    const validProgramIds: string[] = [];
    const now = DateTime.now().setZone(timezone);

    for (const p of activePrograms) {
      if (!p.onboardedAt) continue;

      const program = programMap.get(p.programId);
      if (!program?.durationDays) continue;

      const endDate = DateTime.fromJSDate(new Date(p.onboardedAt))
        .setZone(timezone)
        .plus({ days: program.durationDays })
        .endOf("day");

      if (now <= endDate) {
        validProgramIds.push(p.programId);
      }
    }

    if (!validProgramIds.length) {
      console.log("⛔ All programs expired → STOP WORKFLOW");
      return; // ⛔ stop recursion
    }

    /**
     * 4️⃣ WAIT UNTIL NEXT 10 AM
     */
    const nextRun = getNext10AM(timezone);
    await step.sleepUntil("wait-until-10am", nextRun);

    /**
     * 5️⃣ SEND NOTIFICATION
     */
    await step.run("send-push", async () => {
      console.log("🔔 Sending reminder to:", userId);

      const notification = await prisma.notificationSettings.findUnique({
        where: {
          notification_type: "MMP_DAILY_REMINDER",
        },
      });

      if (!notification) {
        console.warn("⚠️ Notification config missing");
        return;
      }

      let title = notification.title ?? "";
      let message = notification.message ?? "";
      let url: string | null = notification.url ?? null;

      if (notification.isDynamic) {
        const programCount = validProgramIds.length;

        // replace count
        title = title.replaceAll("{{programCount}}", String(programCount));
        message = message.replaceAll("{{programCount}}", String(programCount));

        /**
         * ✅ MULTIPLE PROGRAMS → LANDING PAGE
         */
        if (programCount > 1) {
          url = "/dashboard/mini-mastery-programs";
        }

        /**
         * ✅ SINGLE PROGRAM → PERSONALIZED
         */
        if (programCount === 1) {
          const program = programMap.get(validProgramIds[0]);
          const programName = program?.name ?? "";

          title = title.replaceAll("{{programName}}", programName);
          message = message.replaceAll("{{programName}}", programName);

          if (url) {
            url = url.replaceAll("{{programId}}", validProgramIds[0]);
          }
        }
      }

      await sendPushNotificationToUser(userId, title, message, {
        url,
      });
    });

    /**
     * 6️⃣ RESCHEDULE (ONLY IF STILL ACTIVE)
     */
    await step.run("schedule-next", async () => {
      await inngest.send({
        name: "mmp-program/reminder.start",
        id: `mmp-program-reminder-${userId}`, // ✅ single workflow
        data: {
          userId,
          timezone,
        },
      });
    });
  },
);
