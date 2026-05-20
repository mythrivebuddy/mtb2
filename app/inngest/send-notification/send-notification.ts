import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma, Role } from "@prisma/client";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";
import { sendEmailUsingTemplateWithConditionals } from "@/utils/sendEmail";

type NotificationContext = {
  userName?: string;
  userId?: string;
  // Subscription ✅
  planName?: string;
  subscriptionAmount?: string;
  // Challenge
  challengeTitle?: string;
  challengeId?: string;
  challengeType?: string;

  // MMP
  programName?: string;
  programId?: string;
  programType?: string;

  // Store
  itemName?: string;
  itemId?: string;
  itemType?: string;

  // Spotlight
  spotlightTitle?: string;
  spotlightId?: string;
   currency?: string;
  // Common
  amountSection?: string;
  actionType?: "created" | "updated" | "applied";
};

// ✅ Event Type
type NotificationEvent = {
  types: NotificationType[];
  actorId: string;
  context?: Record<string, unknown>;

  sendToUser?: boolean;
  sendToAdmin?: boolean;
  sendToCoach?: boolean;
  sendEmailAdmin?: boolean;
  adminEntityType?: "CHALLENGE" | "SPOTLIGHT" | "MMP" | "STORE";
  billingType?: "Subscription" | "CMP";
};
function getActionMeta(actionType: string, entityType: string) {
  if (actionType === "updated") {
    return {
      actionLabel: `${entityType} Updated`,
      actionSentence: "has updated the",
    };
  }
  if (actionType === "applied") {
    return {
      actionLabel: `${entityType} Application Submitted 📝`,
      actionSentence: "has applied for a",
    };
  }

  // default → created
  return {
    actionLabel: `New ${entityType} Created`,
    actionSentence: "has created a new",
  };
}

function buildAdminEmailContext(
  entityType: string,
  context: NotificationContext,
) {
  const actionType = context.actionType || "created";

  switch (entityType) {
    case "CHALLENGE": {
      const entityLabel = "Challenge";
      const { actionLabel, actionSentence } = getActionMeta(
        actionType,
        entityLabel,
      );

      return {
        username: context.userName,
        userProfileUrl: `${process.env.NEXT_URL}/profile/${context.userId}`,

        entityType: entityLabel,
        entityTitle: context.challengeTitle,

        actionLabel,
        actionSentence,

        challengeType: context.challengeType,

        amount: context.amountSection
          ? context.amountSection.replace(/^\s*for\s*/i, "")
          : "Free",

        ctaUrl: `${process.env.NEXT_URL}/dashboard/challenge/upcoming-challenges/${context.challengeId}`,
      };
    }

    case "MMP": {
      const entityLabel = "Mini Mastery Program";
      const { actionLabel, actionSentence } = getActionMeta(
        actionType,
        entityLabel,
      );

      return {
        username: context.userName,
        userProfileUrl: `${process.env.NEXT_URL}/profile/${context.userId}`,

        entityType: entityLabel,
        entityTitle: context.programName,

        actionLabel,
        actionSentence,

        challengeType: context.programType,

        amount: context.amountSection
          ? context.amountSection.replace(/^\s*for\s*/i, "")
          : "Free",

        ctaUrl: `${process.env.NEXT_URL}/admin/manage-mini-mastery-program?search=${context.programName}`,
      };
    }
    case "STORE":
      const entityLabel = "Store Item";
      const { actionLabel, actionSentence } = getActionMeta(
        actionType,
        entityLabel,
      );
      return {
        username: context.userName,
        userProfileUrl: `${process.env.NEXT_URL}/profile/${context.userId}`,

        entityType: "Store Item",
        entityTitle: context.itemName,

        // unified template fields
        challengeType: context.itemType || "Item",

        amount: context.amountSection?.replace(/^\s*for\s*/i, ""),

        actionLabel,

        actionSentence,

        ctaUrl: `${process.env.NEXT_URL}/admin/manage-store-product?search=${encodeURIComponent(context.itemName ?? "")}`,
      };

    case "SPOTLIGHT": {
      const entityLabel = "Spotlight";
      const { actionLabel, actionSentence } = getActionMeta(
        context.actionType || "applied",
        entityLabel,
      );

      return {
        username: context.userName,
        userProfileUrl: `${process.env.NEXT_URL}/profile/${context.userId}`,

        entityType: entityLabel,
        entityTitle: context.spotlightTitle || "Spotlight Application",

        actionLabel,
        actionSentence,

        // optional fields (template safe)
        challengeType: "Application",

        // Spotlight has no amount
        amount: undefined,

        ctaUrl: `${process.env.NEXT_URL}/admin/spotlight`,
      };
    }
    default:
      return context;
  }
}
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

      sendEmailAdmin = false,
      adminEntityType,
    } = event.data as NotificationEvent;
    const targetUserId = context?.targetUserId as string | undefined;
    const targetUserIds = context?.targetUserIds as string[] | undefined;
    const finalUserIds = targetUserIds?.length
      ? targetUserIds
      : targetUserId
        ? [targetUserId]
        : [actorId];
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
        orConditions.push({ id: { in: finalUserIds } });
      }

      if (sendToAdmin && allAudiences.has("ADMIN")) {
        orConditions.push({ role: Role.ADMIN, email: process.env.ADMIN_EMAIL });
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
      console.log("users", users);
      const uniqueUsers = Array.from(
        new Map(users.map((u) => [u.id, u])).values(),
      );

      return uniqueUsers;
    });

    if (!recipients.length) {
      console.log("⚠️ No recipients resolved:", types);
      return;
    }
    await step.run("send-admin-email", async () => {
      if (!sendEmailAdmin) return;

      const admin = await prisma.user.findFirst({
        where: {
          role: Role.ADMIN,
          email: process.env.ADMIN_EMAIL,
        },
        select: {
          email: true,
          name: true,
        },
      });

      if (!admin?.email) return;
      // ✅ SUBSCRIPTION FLOW (separate)
      const { billingType } = event.data as NotificationEvent;
      if (billingType) {
          const ctx = context as NotificationContext;
        await sendEmailUsingTemplateWithConditionals({
          toEmail: admin.email,
          toName: admin.name || "Admin",
          templateId: "admin-subscription-cmp", // 👈 create this
          templateData: {
            username: ctx.userName,
          planName: ctx.planName?.replace(/plan/gi, "").trim(),
            billingType,
            amount: ctx?.amountSection?.replace(/^\s*for\s*/i, ""),
            actionLabel: `New ${billingType} Purchased `,
            actionSentence: "has purchased a",
            userProfileUrl: `${process.env.NEXT_URL}/profile/${ctx.userId}`,
          },
        });

        return;
      }

      // ✅ EXISTING FLOW
      if (!adminEntityType) return;
      const emailContext = buildAdminEmailContext(adminEntityType, context);

      await sendEmailUsingTemplateWithConditionals({
        toEmail: admin.email,
        toName: admin.name || "Admin",
        templateId: "admin-entity-created",
        templateData: emailContext,
      });
    });

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
              finalUserIds.includes(user.id)
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
