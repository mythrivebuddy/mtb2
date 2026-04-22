import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { maskEmail } from "@/utils/mask-email";
import { inngest } from "@/lib/inngest";

/* =============================
   🔹 TYPES
============================= */

type NotifyEvent = {
  userId: string;

  // 🔵 Paid
  orderId?: string;

  // 🟢 Free
  entityType?: "MMP" | "CHALLENGE" | "STORE";
  entityId?: string;

  isFree: boolean;
};

type FreeTemplateGroup = {
  user: string;
  creator: string;
  admin: string;
};

type PaidTemplateGroup = {
  creator: string;
  admin: string;
};

type TemplateMap = {
  MMP: {
    free: FreeTemplateGroup;
    paid: PaidTemplateGroup;
  };
  CHALLENGE: {
    free: FreeTemplateGroup;
    paid: PaidTemplateGroup;
  };
  STORE: {
    paid: PaidTemplateGroup;
  };
};

type PaymentData = {
  totalAmount: number;
  discountApplied: number | null;
  paymentId: string | null;
  currency: string;
  createdAt: Date;
    baseAmount: number;
          gstAmount: number,
} | null;

/* =============================
   🔹 FUNCTION
============================= */

export const notifyStakeholders = inngest.createFunction(
  { id: "mmp-challenge-store-notify" },
  { event: "mmp-challenge-store.notify" },

  async ({ event, step }) => {
    const { userId, orderId, entityType, entityId, isFree } =
      event.data as NotifyEvent;

    /* =============================
       🔹 Resolve Entity
    ============================= */

    let finalEntityType: "MMP" | "CHALLENGE" | "STORE";
    let finalEntityId: string;
    let entityName: string;
    let creatorId: string | null = null;
    let redirectUrl: string;

    if (!isFree) {
      const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        select: {
          programId: true,
          challengeId: true,
          contextType: true,
        },
      });

      if (!order) return;

      if (order.programId) {
        const program = await prisma.program.findUnique({
          where: { id: order.programId },
          select: {
            id: true,
            name: true,
            creator: { select: { id: true } },
          },
        });

        if (!program) return;

        finalEntityType = "MMP";
        finalEntityId = program.id;
        entityName = program.name;
        creatorId = program.creator?.id ?? null;
        redirectUrl = `${process.env.NEXT_URL}/dashboard/mini-mastery-programs/program/${program.id}`;
      } else if (order.challengeId) {
        const challenge = await prisma.challenge.findUnique({
          where: { id: order.challengeId },
          select: {
            id: true,
            title: true,
            creator: { select: { id: true } },
          },
        });

        if (!challenge) return;

        finalEntityType = "CHALLENGE";
        finalEntityId = challenge.id;
        entityName = challenge.title;
        creatorId = challenge.creator?.id ?? null;
        redirectUrl = `${process.env.NEXT_URL}/dashboard/challenges/${challenge.id}`;
      } else {
        finalEntityType = "STORE";
        finalEntityId = orderId!;
        entityName = "Your Purchase";
        redirectUrl = `${process.env.NEXT_URL}/dashboard/store/orders`;
      }
    } else {
      finalEntityType = entityType!;
      finalEntityId = entityId!;

      if (entityType === "MMP") {
        const program = await prisma.program.findUnique({
          where: { id: entityId },
          select: {
            name: true,
            creator: { select: { id: true } },
          },
        });

        if (!program) return;

        entityName = program.name;
        creatorId = program.creator?.id ?? null;
        redirectUrl = `${process.env.NEXT_URL}/dashboard/mini-mastery-programs/program/${entityId}`;
      } else {
        const challenge = await prisma.challenge.findUnique({
          where: { id: entityId },
          select: {
            title: true,
            creator: { select: { id: true } },
          },
        });

        if (!challenge) return;

        entityName = challenge.title;
        creatorId = challenge.creator?.id ?? null;
        redirectUrl = `${process.env.NEXT_URL}/dashboard/challenges/${entityId}`;
      }
    }

    /* =============================
       🔹 Fetch Users
    ============================= */

    const [user, creator, admin] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),

      creatorId
        ? prisma.user.findUnique({
            where: { id: creatorId },
            select: { id: true, name: true, email: true },
          })
        : null,

      prisma.user.findFirst({
        where: {
          role: "ADMIN",
          email: process.env.ADMIN_EMAIL,
        },
        select: { id: true, name: true, email: true },
      }),
    ]);

    if (!user) return;

    /* =============================
       🔹 Payment Data
    ============================= */

    let paymentData: PaymentData = null;

    if (!isFree && orderId) {
      paymentData = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        select: {
          totalAmount: true,
          discountApplied: true,
          paymentId: true,
          currency: true,
          createdAt: true,
          baseAmount: true,
          gstAmount: true,
        },
      });
    }
   let financials = null;

if (!isFree && paymentData) {
  const baseAmount = paymentData.baseAmount ?? 0;
  const discount = paymentData.discountApplied ?? 0;
  const gst = paymentData.gstAmount ?? 0;
  const totalPaid = paymentData.totalAmount ?? 0;

  const netBase = Math.max(baseAmount - discount, 0);

  const commissionPercent = 20;

  const platformFee = (netBase * commissionPercent) / 100;
  const creatorEarning = netBase - platformFee;
  const platformEarning = platformFee;

  financials = {
    baseAmount: baseAmount.toFixed(2),
    discount: discount.toFixed(2),
    netBase: netBase.toFixed(2),
    gst: gst.toFixed(2),
    totalPaid: totalPaid.toFixed(2),

    commissionPercent,
    platformFee: platformFee.toFixed(2),
    creatorEarning: creatorEarning.toFixed(2),
    platformEarning: platformEarning.toFixed(2),
  };
}
    /* =============================
       🔹 Template Map
    ============================= */

    const templateMap: TemplateMap = {
      MMP: {
        free: {
          user: "mmp-free-enrolled-user",
          creator: "mmp-free-enrolled-creator",
          admin: "mmp-free-enrolled-admin",
        },
        paid: {
          //   user: "mmp-paid-enrolled-user",
          creator: "mmp-paid-enrolled-creator",
          admin: "mmp-paid-enrolled-admin",
        },
      },

      CHALLENGE: {
        free: {
          user: "challenge-joined-free",
          creator: "coach-user-joined-challenge",
          admin: "challenge-joined-admin",
        },
        paid: {
          creator: "coach-user-joined-paid-challenge",
          admin: "challenge-joined-admin",
        },
      },

      STORE: {
        paid: {
          creator: "store-order-seller",
          admin: "store-order-admin",
        },
      },
    };

    /* =============================
       🔹 Resolve Templates (SAFE)
    ============================= */

    let templates: FreeTemplateGroup | PaidTemplateGroup | undefined;

    if (finalEntityType === "STORE") {
      templates = templateMap.STORE.paid;
    } else {
      templates = isFree
        ? templateMap[finalEntityType].free
        : templateMap[finalEntityType].paid;
    }

    if (!templates) return;

    /* =============================
       🔹 Admin URL
    ============================= */

    const adminUrlMap = {
      MMP: `/admin/manage-mini-mastery-program/students?programId=${finalEntityId}`,
      CHALLENGE: `/admin/manage-challenges/users?challengeId=${finalEntityId}`,
      STORE: `/admin/store/orders`,
    };

    const adminUrl = `${process.env.NEXT_URL}${adminUrlMap[finalEntityType]}`;

    /* =============================
       🔔 PUSH
    ============================= */

    await step.run("push-joiner", async () => {
      await sendPushNotificationToUser(
        user.id,
        "You're In! 🎉",
        `You’ve successfully joined "${entityName}". Tap to start.`,
        { url: redirectUrl },
      );
    });

    if (creator?.id && creator.id !== user.id) {
      await step.run("push-creator", async () => {
        await sendPushNotificationToUser(
          creator.id,
          `${finalEntityType} • New Enrollment`,
          `${user.name} joined ${entityName}`,
          { url: redirectUrl },
        );
      });
    }

    if (admin?.id && admin.id !== creator?.id && admin.id !== user.id) {
      await step.run("push-admin", async () => {
        await sendPushNotificationToUser(
          admin.id,
          "New Enrollment",
          `${user.name} joined ${entityName}`,
          { url: adminUrl },
        );
      });
    }

    /* =============================
       📧 EMAILS
    ============================= */

    // JOINER
    // ✅ JOINER → ONLY for FREE flows
    if (isFree && user.email) {
      const freeTemplates = templates as FreeTemplateGroup;

      await step.run("email-joiner", async () => {
        await sendEmailUsingTemplate({
          toEmail: user.email,
          toName: user.name,
          templateId: freeTemplates.user,
          templateData: {
            username: user.name,
            programName: entityName,
            programUrl: redirectUrl,
          },
        });
      });
    }

    // CREATOR
    if (creator?.email && creator.id !== user.id) {
      await step.run("email-creator", async () => {
        await sendEmailUsingTemplate({
          toEmail: creator.email,
          toName: creator.name,
          templateId: templates.creator,
          templateData: {
            creatorName: creator.name,
            username: user.name,
            programName: entityName,
            programUrl: redirectUrl,
            userEmail: maskEmail(user.email ?? ""),
            ...financials,
            paymentDate: paymentData?.createdAt,
          },
        });
      });
    }

    // ADMIN
    if (admin?.email && admin.id !== creator?.id && admin.id !== user.id) {
      await step.run("email-admin", async () => {
        await sendEmailUsingTemplate({
          toEmail: admin.email,
          toName: admin.name,
          templateId: templates.admin,
          templateData: {
            username: user.name,
            userEmail: maskEmail(user.email ?? ""),
            programName: entityName,
            creatorName: creator?.name ?? "Unknown",
            programUrl: adminUrl,

            ...financials,

            paymentDate: paymentData?.createdAt,
            transactionId: paymentData?.paymentId,
          },
        });
      });
    }
  },
);
