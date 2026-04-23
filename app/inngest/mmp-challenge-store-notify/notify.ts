import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import {
  sendEmailUsingTemplate,
  sendEmailUsingTemplateWithConditionals,
} from "@/utils/sendEmail";
import { maskEmail } from "@/utils/mask-email";
import { inngest } from "@/lib/inngest";
import { checkFeature } from "@/lib/access-control/checkFeature";

/* =============================
   🔹 TYPES
============================= */
type OrderItemLite = {
  originalPrice: number | null;
  priceAtPurchase: number;
  quantity: number;
};
type NotifyEvent = {
  userId: string;

  // 🔵 Paid
  orderId?: string;

  // 🟢 Free
  entityType?: "MMP" | "CHALLENGE" | "STORE";
  entityId?: string;

  isFree: boolean;
  isWallet?: boolean;
  walletCurrency?: string;
  walletAmount?: number;
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
  gstAmount: number;
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
    let startDate: string | null = null;
    const baseUrl = process.env.NEXT_URL!;

    if (!isFree) {
      // ✅ WALLET FLOW (NO paymentOrder)
      if (event.data.isWallet) {
        finalEntityType = "STORE";
        finalEntityId = orderId!;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
          },
        });

        if (!order) return;

        const firstItem = order.items[0];

        let product = null;

        if (firstItem?.itemId) {
          product = await prisma.item.findUnique({
            where: { id: firstItem.itemId },
            select: {
              name: true,
              createdByUserId: true,
            },
          });
        }

        entityName = product?.name || "Your Purchase";
        creatorId = product?.createdByUserId ?? null;

        redirectUrl = `${process.env.NEXT_URL}/dashboard/store`;
      } else {
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
              startDate: true,
              creator: { select: { id: true } },
            },
          });

          if (!challenge) return;

          finalEntityType = "CHALLENGE";
          finalEntityId = challenge.id;
          entityName = challenge.title;
          creatorId = challenge.creator?.id ?? null;
          redirectUrl = `${process.env.NEXT_URL}/dashboard/challenge/my-challenges/${challenge.id}`;
        } else {
          finalEntityType = "STORE";
          finalEntityId = orderId!;

          const storeOrder = await prisma.paymentOrder.findUnique({
            where: { id: orderId },
            select: {
              cartSnapshot: true,
              storeOrderId: true,
            },
          });

          if (!storeOrder) return;

          let itemName = "Your Purchase";
          let itemId: string | null = null;

          try {
            let item = null;

            if (Array.isArray(storeOrder.cartSnapshot)) {
              item = storeOrder.cartSnapshot[0];
            } else if (typeof storeOrder.cartSnapshot === "string") {
              try {
                const parsed = JSON.parse(storeOrder.cartSnapshot);
                item = Array.isArray(parsed) ? parsed[0] : null;
              } catch (err) {
                console.error("Cart snapshot parse failed:", err);
              }
            }

            itemName = item?.name || "Your Purchase";

            // 🔥 FIX: support both keys
            itemId = item?.itemId || item?.productId || null;
            console.log("🧾 STORE ITEM DEBUG:", {
              rawSnapshot: storeOrder.cartSnapshot,
              parsedItem: item,
              itemId,
            });
          } catch {}

          entityName = itemName;

          // 🔥 fetch actual product (to get creator)
          if (itemId) {
            const product = await prisma.item.findUnique({
              where: { id: itemId },
              select: {
                createdByUserId: true,
                currency: true,
              },
            });
            console.log("🛒 PRODUCT DEBUG:", product);
            if (product?.createdByUserId) {
              creatorId = product.createdByUserId;
            }
          }

          redirectUrl = `${process.env.NEXT_URL}/dashboard/store`;
        }
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
            startDate: true,
            creator: { select: { id: true } },
          },
        });

        if (!challenge) return;

        entityName = challenge.title;
        creatorId = challenge.creator?.id ?? null;
        redirectUrl = `${process.env.NEXT_URL}/dashboard/challenge/my-challenges/${entityId}`;
        startDate = challenge.startDate
          ? new Date(challenge.startDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "N/A";
      }
    }
    const isChallenge = finalEntityType === "CHALLENGE";

    const nameKey = isChallenge ? "challengeName" : "programName";
    const urlKey = isChallenge ? "challengeUrl" : "programUrl";
    const commonChallengeData = isChallenge
      ? {
          challengeType: isFree ? "Free" : "Paid",

          challengeUrl: redirectUrl,

          participantsUrl: `${baseUrl}/dashboard/challenge/${finalEntityId}/participants`,

          startDate, // optional: fetch if needed

          transactionPageUrl: `${baseUrl}/dashboard/transactions-history`,
        }
      : {};
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
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              membership: true,
            },
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
    console.log("DEBUG CREATOR:", {
      creatorId,
      creatorFound: !!creator,
    });

    if (!user) return;

    let orderItems: OrderItemLite[] = [];
    type OrderWithItems = Awaited<
      ReturnType<typeof prisma.order.findUnique>
    > & {
      items: {
        quantity: number;
        priceAtPurchase: number;
        originalPrice: number | null;
        item: {
          name: string;
          currency: string;
        } | null;
      }[];
    };

    let orderWithItems: OrderWithItems | null = null;
    let derivedDiscount = 0;

    if (!isFree && orderId && finalEntityType === "STORE") {
      orderWithItems = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              item: {
                select: {
                  name: true,
                  currency: true,
                },
              },
            },
          },
        },
      });

      if (orderWithItems?.items) {
        orderItems = orderWithItems.items;
      }
      if (orderItems.length > 0) {
        derivedDiscount = orderItems.reduce((sum, item) => {
          const original = item.originalPrice ?? item.priceAtPurchase;
          const discountPerUnit = original - item.priceAtPurchase;
          const itemDiscount = discountPerUnit * item.quantity;

          return sum + Math.max(itemDiscount, 0);
        }, 0);
      }
    }
    let itemNames = "";
    let itemCount = 0;
    let orderDate = "";
    let currency = "";

    if (orderWithItems) {
      itemCount = orderWithItems.items.length;

      itemNames = orderWithItems.items
        .map((i) => i.item?.name || "Product")
        .join(", ");

      orderDate = new Date(orderWithItems.createdAt).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      );

      currency = orderWithItems.items[0]?.item?.currency || "INR";
    }
    /* =============================
       🔹 Payment Data
    ============================= */

    let paymentData: PaymentData = null;
    if (event.data.isWallet) {
      const totalPaid = event.data.walletAmount || 0;

      paymentData = {
        totalAmount: totalPaid,
        discountApplied: derivedDiscount, // ✅ FIX
        paymentId: null,
        currency: event.data.walletCurrency || "GP",
        createdAt: new Date(),
        baseAmount: totalPaid + derivedDiscount, // ✅ FIX
        gstAmount: 0,
      };
    } else if (!isFree && orderId && !event.data.wallet) {
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
    if (event.data.isWallet && finalEntityType === "STORE") {
      const totalPaid = event.data.walletAmount || 0;
      const discount = derivedDiscount;
      const baseAmount = totalPaid + discount;

      financials = {
        baseAmount: baseAmount.toFixed(2),
        discount: discount.toFixed(2),
        netBase: totalPaid.toFixed(2),
        gst: "0.00",
        totalPaid: totalPaid.toFixed(2),

        commissionPercent: 0,
        platformFee: "0.00",
        creatorEarning: totalPaid.toFixed(2),
        platformEarning: "0.00",
      };
    }
    if (!isFree && paymentData && finalEntityType !== "STORE") {
      const baseAmount = paymentData.baseAmount ?? 0;
      const discount = paymentData.discountApplied ?? 0;
      const gst = paymentData.gstAmount ?? 0;
      const totalPaid = paymentData.totalAmount ?? 0;

      const netBase = Math.max(baseAmount - discount, 0);

      let commissionPercent = 0;

      if (!creator) {
        throw new Error("Creator required for commission calculation");
      }

      if (finalEntityType === "CHALLENGE") {
        const featureCheck = checkFeature({
          feature: "challenges",
          user: {
            userType: creator.userType,
            membership: creator.membership,
          },
        });

        if (!featureCheck.allowed) {
          throw new Error("Commission config not found for challenge");
        }

        commissionPercent = (
          featureCheck.config as {
            commissionPercent: number;
          }
        ).commissionPercent;
      } else if (finalEntityType === "MMP") {
        const featureCheck = checkFeature({
          feature: "miniMasteryPrograms",
          user: {
            userType: creator.userType,
            membership: creator.membership,
          },
        });

        if (!featureCheck.allowed) {
          throw new Error("Commission config not found for MMP");
        }

        commissionPercent = (
          featureCheck.config as {
            commissionPercent: number;
          }
        ).commissionPercent;
      }
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
    if (
      !isFree &&
      paymentData &&
      finalEntityType === "STORE" &&
      !event.data.isWallet
    ) {
      if (!creator) {
        throw new Error("Creator required for store commission calculation");
      }

      const baseAmount = paymentData.baseAmount ?? 0;
      const discount =
        derivedDiscount > 0
          ? derivedDiscount
          : (paymentData.discountApplied ?? 0);
      const gst = paymentData.gstAmount ?? 0;
      const totalPaid = paymentData.totalAmount ?? 0;

      const netBase = Math.max(baseAmount - discount, 0);

      // 🔥 SAME PATTERN AS OTHERS
      const featureCheck = checkFeature({
        feature: "store",
        user: {
          userType: creator.userType,
          membership: creator.membership,
        },
      });

      if (!featureCheck.allowed) {
        throw new Error("Commission config not found for store");
      }

      const commissionPercent = (
        featureCheck.config as {
          commissionPercent: number;
        }
      ).commissionPercent;

      const platformFee = (netBase * commissionPercent) / 100;
      const creatorEarning = netBase - platformFee;

      financials = {
        baseAmount: baseAmount.toFixed(2),
        discount: discount.toFixed(2),
        netBase: netBase.toFixed(2),
        gst: gst.toFixed(2),
        totalPaid: totalPaid.toFixed(2),

        commissionPercent,
        platformFee: platformFee.toFixed(2),
        creatorEarning: creatorEarning.toFixed(2),
        platformEarning: platformFee.toFixed(2),
      };
    }

    const isGP = paymentData?.currency === "GP";

    const currencySymbol =
      paymentData?.currency === "INR"
        ? "₹"
        : paymentData?.currency === "USD"
          ? "$"
          : paymentData?.currency === "GP"
            ? "GP"
            : "";
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
          admin: "challenge-joined-admin-free",
        },
        paid: {
          creator: "coach-user-joined-paid-challenge",
          admin: "challenge-joined-admin-paid",
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
      try {
        const buyerTitle =
          finalEntityType === "STORE"
            ? "🛍️ Purchase Successful"
            : "You're In! 🎉";

        const buyerMessage =
          finalEntityType === "STORE"
            ? event.data.isWallet
              ? `You purchased "${entityName}" using GP wallet.`
              : `You purchased "${entityName}". Tap to view your order.`
            : `You’ve successfully joined "${entityName}". Tap to start.`;

        await sendPushNotificationToUser(user.id, buyerTitle, buyerMessage, {
          url: redirectUrl,
        });
      } catch (err) {
        console.error("Buyer push failed:", err);
      }
    });

    if (!isFree && event.data.isWallet && user.email) {
      await step.run("email-buyer-wallet", async () => {
        await sendEmailUsingTemplate({
          toEmail: user.email!,
          toName: user.name ?? "Customer",
          templateId: "order-placed",
          templateData: {
            username: user.name ?? "Customer",
            orderId: orderId,
            orderDate,
            totalAmount: `${event.data.walletAmount} ${currency}`,
            status: "COMPLETED",
            itemCount,
            itemNames,
            orderUrl: `${baseUrl}/dashboard/store/profile`,
            currency,
            paymentDetails: `Paid entirely with ${currency} from your balance`,
          },
        });
      });
    }
    const creatorMessage =
      finalEntityType === "STORE"
        ? `You made a sale! ${user.name} purchased "${entityName}".`
        : `${user.name} joined ${entityName}`;

    const creatorTitle =
      finalEntityType === "STORE"
        ? "🛒 New Product Purchase"
        : finalEntityType === "CHALLENGE"
          ? "🎯 New Challenge Participant"
          : "📘 New Program Enrollment";

    if (creator?.id && creator.id !== user.id) {
      await step.run("push-creator", async () => {
        await sendPushNotificationToUser(
          creator.id,
          creatorTitle,
          creatorMessage,
          { url: redirectUrl },
        );
      });
    }

    if (admin?.id && admin.id !== creator?.id && admin.id !== user.id) {
      await step.run("push-admin", async () => {
        const adminTitle =
          finalEntityType === "STORE" ? "🛒 New Store Order" : "New Enrollment";

        const adminMessage =
          finalEntityType === "STORE"
            ? `${user.name} purchased ${entityName}`
            : `${user.name} joined ${entityName}`;
        await sendPushNotificationToUser(admin.id, adminTitle, adminMessage, {
          url: adminUrl,
        });
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
            [nameKey]: entityName,
            [urlKey]: redirectUrl,

            ...commonChallengeData,
          },
        });
      });
    }

    // CREATOR
    if (creator?.email && creator.id !== user.id) {
      await step.run("email-creator", async () => {
        await sendEmailUsingTemplateWithConditionals({
          toEmail: creator.email,
          toName: creator.name,
          templateId: templates.creator,
          templateData: {
            coachName: creator.name,
            sellerName: finalEntityType === "STORE" ? creator.name : null,
            username: user.name,
            [nameKey]: entityName,
            productName: finalEntityType === "STORE" ? entityName : null,
            [urlKey]: redirectUrl,
            userEmail: maskEmail(user.email ?? ""),

            ...(financials || {}),
            coachEarning: financials?.creatorEarning,
            ...commonChallengeData,
            isStore: finalEntityType === "STORE",
            isGP,
            currencySymbol,
            amount: financials?.totalPaid ?? null,
            paymentMethod: event.data.isWallet ? "Wallet (GP)" : "Online",

            paymentDate: paymentData?.createdAt
              ? new Date(paymentData.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "N/A",
          },
        });
      });
    }

    // ADMIN
    if (admin?.email && admin.id !== creator?.id && admin.id !== user.id) {
      await step.run("email-admin", async () => {
        await sendEmailUsingTemplateWithConditionals({
          toEmail: admin.email,
          toName: admin.name,
          templateId: templates.admin,
          templateData: {
            username: user.name,
            userEmail: maskEmail(user.email ?? ""),
            [nameKey]: entityName,
            creatorName: creator?.name ?? "Unknown",
            [urlKey]: adminUrl,

            ...(financials || {}),

            ...commonChallengeData,
            isStore: finalEntityType === "STORE",
            productName: finalEntityType === "STORE" ? entityName : null,

            isGP,
            currencySymbol,
            amount: financials?.totalPaid ?? null,
            paymentMethod: event.data.isWallet ? "Wallet (GP)" : "Online",

            paymentDate: paymentData?.createdAt
              ? new Date(paymentData.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "N/A",

            transactionId: paymentData?.paymentId,
          },
        });
      });
    }
  },
);
