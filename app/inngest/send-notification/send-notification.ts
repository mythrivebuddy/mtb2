import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma, Role } from "@prisma/client";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";

// ✅ Event Type
type NotificationEvent = {
  types: NotificationType[];
  actorId: string;
  context?: Record<string, unknown>;

  sendToUser?: boolean;
  sendToAdmin?: boolean;
  sendToCoach?: boolean;
};

export const sendNotifications = inngest.createFunction(
  {
    id: "send-notification",
    triggers: [{ event: "notification/send" }],
  },
  async ({ event, step }) => {
    const {
      types,
      actorId,
      context = {},
      sendToUser = true,
      sendToAdmin = true,
      sendToCoach = true,
    } = event.data as NotificationEvent;

    // 1️⃣ Fetch ALL templates
    const settings = await step.run("get-templates", async () => {
      return prisma.notificationSettings.findMany({
        where: {
          notification_type: { in: types },
        },
      });
    });

    if (!settings.length) {
      console.warn("❌ No notification templates found:", types);
      return;
    }

    // 2️⃣ Resolve recipients
    const recipients = await step.run("resolve-recipients", async () => {
      const allAudiences = new Set(
        settings.flatMap((s) => s.audiences ?? ["USER"]),
      );

      const orConditions: Prisma.UserWhereInput[] = [];

      if (sendToUser && allAudiences.has("USER")) {
        orConditions.push({ id: actorId });
      }

      if (sendToAdmin && allAudiences.has("ADMIN")) {
        orConditions.push({ role: Role.ADMIN, email:process.env.ADMIN_EMAIL });
      }

      if (sendToCoach && allAudiences.has("COACH")) {
        orConditions.push({ userType: "COACH" });
      }

      if (!orConditions.length) return [];

      const users = await prisma.user.findMany({
        where: { OR: orConditions },
        select: {
          id: true,
          role: true,
          userType: true,
        },
      });

      return users;
    });

    if (!recipients.length) {
      console.log("⚠️ No recipients resolved:", types);
      return;
    }

    

    // 4️⃣ Send notifications
    await step.run("send-to-all", async () => {
      await Promise.all(
        recipients.map(async (user) => {
          for (const setting of settings) {
            const audiences = setting.audiences ?? ["USER"];

            let shouldSend = false;

            // ✅ USER
            if (
              audiences.includes("USER") &&
              sendToUser &&
              user.id === actorId
            ) {
              shouldSend = true;
            }

            // ✅ ADMIN
            if (
              audiences.includes("ADMIN") &&
              sendToAdmin &&
              user.role === Role.ADMIN
            ) {
              shouldSend = true;
            }

            // ✅ COACH
            if (
              audiences.includes("COACH") &&
              sendToCoach &&
              user.userType === "COACH"
            ) {
              shouldSend = true;
            }

            if (!shouldSend) continue;

            await sendPushNotificationFromDBToUser({
              type: setting.notification_type,
              userId: user.id,
              context,
            });
          }
        }),
      );
    });
  },
);
