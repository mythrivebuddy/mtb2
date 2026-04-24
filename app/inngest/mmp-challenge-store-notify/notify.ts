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
type CartItem = {
  itemId?: string | null;
  productId?: string | null;
  name?: string;
  item?: {
    name?: string;
  };
  price?: number;
  discount?: number;
  quantity?: number;
  gst?: number;
};
type StoreOrderItem = {
  itemId: string | null;
  quantity: number;
  priceAtPurchase: number;
  originalPrice: number | null;
  gstAmount?: number | null;
  item: {
    id: string;
    name: string;
    currency: string;
  } | null;
};

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
  {
    id: "mmp-challenge-store-notify",
    triggers: [{ event: "mmp-challenge-store.notify" }],
  },

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
    let entityDisplayName = "";
    let entityFullNames = "";
    const creatorMap = new Map<
      string,
      {
        creatorId: string;
        items: StoreOrderItem[];
      }
    >();
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        email: process.env.ADMIN_EMAIL,
      },
      select: { id: true, name: true, email: true },
    });

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
        const productIds = order.items
          .map((i) => i.itemId)
          .filter((id): id is string => !!id);

        // ✅ fetch all products in ONE query
        const products = await prisma.item.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            createdByUserId: true,
          },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const orderItem of order.items) {
          const product = productMap.get(orderItem.itemId);
          if (!product?.createdByUserId) continue;

          const creatorId = product.createdByUserId;

          if (!creatorMap.has(creatorId)) {
            creatorMap.set(creatorId, {
              creatorId,
              items: [],
            });
          }

          creatorMap.get(creatorId)!.items.push({
            itemId: orderItem.itemId,
            quantity: orderItem.quantity,
            priceAtPurchase: orderItem.priceAtPurchase ?? 0,
            originalPrice: null,
            item: {
              id: orderItem.itemId!,
              name: product.name,
              currency: "GP",
            },
          });
        }
        // ✅ pick name (first item only for display)
        entityFullNames = products
          .filter((p) => p.createdByUserId !== admin?.id)
          .map((p) => p.name || "Product")
          .join(", ");

        entityDisplayName =
          products.length === 1
            ? products[0]?.name || "Product"
            : `${products.length} items`;

        entityName = entityDisplayName;
        if (!entityFullNames) {
          entityFullNames = entityName;
        }

        // ❗ DO NOT set creatorId here (multi creator case)
        creatorId = null;

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

          // const itemName = "Your Purchase";
          // let itemId: string | null = null;

          let items = [];
          try {
            try {
              if (Array.isArray(storeOrder.cartSnapshot)) {
                items = storeOrder.cartSnapshot;
              } else if (typeof storeOrder.cartSnapshot === "string") {
                const parsed = JSON.parse(storeOrder.cartSnapshot);
                items = Array.isArray(parsed) ? parsed : [];
              }
            } catch (err) {
              console.error("Cart snapshot parse failed:", err);
            }

            // ✅ derive entity name
          } catch {}

          // entityName = itemName;

          // 🔥 fetch actual product (to get creator)
          const itemIds = items
            .map((i) => i.itemId || i.productId)
            .filter(Boolean);

          const products = await prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: {
              id: true,
              createdByUserId: true,
              name: true,
              currency: true,
            },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));
          const getItemName = (i: CartItem) =>
            i?.item?.name || i?.name || "Product";

          entityDisplayName =
            items.length === 1
              ? getItemName(items[0])
              : `${items.length} items`;

          entityFullNames = items
            .filter((i) => {
              const itemId = i.itemId || i.productId;
              const product = productMap.get(itemId);
              return product?.createdByUserId !== admin?.id;
            })
            .map(getItemName)
            .join(", ");

          // IMPORTANT
          entityName = entityDisplayName;
          // ✅ BUILD creatorMap properly
          for (const cartItem of items) {
            const itemId = cartItem.itemId || cartItem.productId;
            if (!itemId) continue;

            const product = productMap.get(itemId);
            if (!product?.createdByUserId) continue;

            const creatorIdLocal = product.createdByUserId;

            if (!creatorMap.has(creatorIdLocal)) {
              creatorMap.set(creatorIdLocal, {
                creatorId: creatorIdLocal,
                items: [],
              });
            }

            // AFTER (correct)
            const basePrice = cartItem.price || 0;
            const discount = cartItem.discount || 0;
            const paidBase = basePrice - discount;

            creatorMap.get(creatorIdLocal)!.items.push({
              itemId,
              quantity: cartItem.quantity || 1,
              priceAtPurchase: paidBase,
              originalPrice: basePrice,
              gstAmount: cartItem.gst || 0,
              item: {
                id: itemId,
                name: product.name,
                currency: product.currency || "INR",
              },
            });
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

    let orderItems: OrderItemLite[] = [];
    type OrderWithItems = Awaited<
      ReturnType<typeof prisma.order.findUnique>
    > & {
      items: StoreOrderItem[];
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
                  id: true,
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

    if (
      orderWithItems?.items?.length &&
      creatorMap.size === 0 // ✅ ONLY if not already built
    ) {
      const productIds = orderWithItems.items
        .map((i) => i.item?.id || i.itemId)
        .filter((id): id is string => !!id);

      const products = await prisma.item.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          createdByUserId: true,
        },
      });

      const productToCreator = new Map(
        products.map((p) => [p.id, p.createdByUserId]),
      );

      for (const item of orderWithItems.items) {
        const productId = item.item?.id || item.itemId;
        if (!productId) continue;

        const creatorId = productToCreator.get(productId);
        if (!creatorId) continue;

        if (!creatorMap.has(creatorId)) {
          creatorMap.set(creatorId, {
            creatorId,
            items: [],
          });
        }

        creatorMap.get(creatorId)!.items.push(item);
      }
    }
    const [user, creators] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),

      prisma.user.findMany({
        where: {
          id: {
            in:
              finalEntityType === "STORE"
                ? Array.from(creatorMap.keys())
                : creatorId
                  ? [creatorId]
                  : [],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          membership: true,
        },
      }),
    ]);

    const creator =
      finalEntityType === "STORE"
        ? creators.length === 1
          ? creators[0]
          : null
        : creators[0] || null;

    if (!user) return;
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
      !event.data.isWallet &&
      creators.length === 1
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
      //
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
    const creatorFinancialsMap = new Map<
      string,
      {
        baseAmount: number;
        discount: number;
        netBase: number;
        gst: number;
        totalPaid: number;
        platformFee: number;
        creatorEarning: number;
      }
    >();
    if (finalEntityType === "STORE") {
      for (const creator of creators) {
        if (creator.id === user.id) continue;
        const creatorItems = creatorMap.get(creator.id)?.items || [];

        const creatorItemNames = creatorItems
          .map((i) => i.item?.name || "Product")
          .join(", ");
        if (!creator.email) continue;

        await step.run(`push-creator-${creator.id}`, async () => {
          await sendPushNotificationToUser(
            creator.id,
            creatorTitle,
            `${user.name} purchased ${creatorItemNames}`,
            { url: redirectUrl },
          );
        });
      }
    } else {
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
    if (finalEntityType === "STORE") {
      for (const creator of creators) {
        if (creator.id === user.id || !creator.email) continue;
        const creatorItems = creatorMap.get(creator.id)?.items || [];

        const creatorItemNames = creatorItems
          .map((i) => i.item?.name || "Product")
          .join(", ");

        // 🔥 CALCULATE PER CREATOR TOTAL
        const creatorBase = creatorItems.reduce((sum, item) => {
          return sum + item.priceAtPurchase * item.quantity;
        }, 0);

        const creatorOriginal = creatorItems.reduce((sum, item) => {
          const original = item.originalPrice ?? item.priceAtPurchase;
          return sum + original * item.quantity;
        }, 0);

        const creatorDiscount = Math.max(creatorOriginal - creatorBase, 0);
        const creatorGST = creatorItems.reduce((sum, item) => {
          return sum + (item.gstAmount || 0) * item.quantity;
        }, 0);
        const netBase = creatorBase;
        const totalPaid = netBase + creatorGST;

        const featureCheck = checkFeature({
          feature: "store",
          user: {
            userType: creator.userType,
            membership: creator.membership,
          },
        });

        if (!featureCheck.allowed) {
          console.log("❌ No commission config for creator:", creator.id);
          return;
        }

        const commissionPercent = (
          featureCheck.config as { commissionPercent: number }
        ).commissionPercent;

        const platformFee = (netBase * commissionPercent) / 100;
        const creatorEarning = netBase - platformFee;

        const creatorFinancials = {
          baseAmount: creatorOriginal.toFixed(2),
          discount: creatorDiscount.toFixed(2),
          netBase: netBase.toFixed(2),
          gst: creatorGST.toFixed(2),
          totalPaid: totalPaid.toFixed(2),

          commissionPercent,
          platformFee: platformFee.toFixed(2),
          creatorEarning: creatorEarning.toFixed(2),
          platformEarning: platformFee.toFixed(2),
        };
        creatorFinancialsMap.set(creator.id, {
          baseAmount: creatorOriginal,
          discount: creatorDiscount,
          netBase: netBase,
          gst: creatorGST,
          totalPaid: totalPaid,
          platformFee: platformFee,
          creatorEarning: creatorEarning,
        });

        await step.run(`email-creator-${creator.id}`, async () => {
          await sendEmailUsingTemplateWithConditionals({
            toEmail: creator.email,
            toName: creator.name,
            templateId: templates.creator,
            templateData: {
              sellerName: creator.name,
              username: user.name,
              productName: creatorItemNames,
              userEmail: maskEmail(user.email ?? ""),

              ...creatorFinancials,
              isStore: true,

              showEarnings: creator.id !== admin?.id,
              isGP,
              currencySymbol,
              amount: creatorFinancials.totalPaid,
              paymentMethod: event.data.isWallet ? "Wallet (GP)" : "Online",

              paymentDate: paymentData?.createdAt
                ? new Date(paymentData.createdAt).toLocaleDateString("en-GB")
                : "N/A",
            },
          });
        });
      }
    } else {
      if (creator?.email && creator.id !== user.id) {
        await step.run("email-creator", async () => {
          await sendEmailUsingTemplateWithConditionals({
            toEmail: creator.email,
            toName: creator.name,
            templateId: templates.creator,
            templateData: {
              username: user.name,
              [nameKey]: entityName,
              [urlKey]: redirectUrl,
              showEarnings: creator.id !== admin?.id,
              ...(financials
                ? {
                    ...financials,
                    coachEarning: financials.creatorEarning,
                  }
                : {}),
              paymentDate: paymentData?.createdAt
                ? new Date(paymentData.createdAt).toLocaleDateString("en-GB")
                : "N/A",
            },
          });
        });
      }
    }
    let adminFinancials = null;
    const perProductBreakdown: Array<{
      productName: string;
      sellerName: string;
      baseAmount: string;
      discount: string;
      netBase: string;
      gst: string;
      totalPaid: string;
      commissionPercent: number;
      platformFee: string;
      creatorEarning: string;
    }> = [];

    if (finalEntityType === "STORE" && creatorFinancialsMap.size > 0) {
      let totalOriginal = 0;
      let totalDiscount = 0;
      let totalNetBase = 0;
      let totalGST = 0;
      let totalPlatformFee = 0;
      let totalCreatorEarning = 0;

      for (const [creatorIdKey, data] of creatorFinancialsMap.entries()) {
        if (creatorIdKey === admin?.id) continue;
        totalOriginal += data.baseAmount;
        totalDiscount += data.discount;
        totalNetBase += data.netBase;
        totalGST += data.gst;
        totalPlatformFee += data.platformFee;
        totalCreatorEarning += data.creatorEarning;

        // ✅ Build per-product rows for admin breakdown table
        // ❗ skip admin products in breakdown
        if (creatorIdKey === admin?.id) continue;
        const creatorUser = creators.find((c) => c.id === creatorIdKey);
        const creatorItems = creatorMap.get(creatorIdKey)?.items || [];

        for (const item of creatorItems) {
          const itemOriginal =
            (item.originalPrice ?? item.priceAtPurchase) * item.quantity;
          const itemPaid = item.priceAtPurchase * item.quantity;
          const itemDiscount = Math.max(itemOriginal - itemPaid, 0);
          const itemGST = (item.gstAmount || 0) * item.quantity;

          // Get this creator's commission percent
          let itemCommissionPercent = 0;
          if (creatorUser) {
            const fc = checkFeature({
              feature: "store",
              user: {
                userType: creatorUser.userType,
                membership: creatorUser.membership,
              },
            });
            if (fc.allowed) {
              itemCommissionPercent = (
                fc.config as { commissionPercent: number }
              ).commissionPercent;
            }
          }

          const itemPlatformFee = (itemPaid * itemCommissionPercent) / 100;
          const itemCreatorEarning = itemPaid - itemPlatformFee;

          perProductBreakdown.push({
            productName: item.item?.name || "Product",
            sellerName: creatorUser?.name || "Unknown",
            baseAmount: itemOriginal.toFixed(2),
            discount: itemDiscount.toFixed(2),
            netBase: itemPaid.toFixed(2),
            gst: itemGST.toFixed(2),
            totalPaid: (itemPaid + itemGST).toFixed(2),
            commissionPercent: itemCommissionPercent,
            platformFee: itemPlatformFee.toFixed(2),
            creatorEarning: itemCreatorEarning.toFixed(2),
          });
        }
      }

      const totalPaid = totalNetBase + totalGST;

      const avgCommissionPercent =
        totalNetBase > 0 ? (totalPlatformFee / totalNetBase) * 100 : 0;
      adminFinancials = {
        baseAmount: totalOriginal.toFixed(2),
        discount: totalDiscount.toFixed(2),
        netBase: totalNetBase.toFixed(2),
        gst: totalGST.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        commissionPercent: avgCommissionPercent.toFixed(2),
        platformFee: totalPlatformFee.toFixed(2),
        creatorEarning: totalCreatorEarning.toFixed(2),
        platformEarning: totalPlatformFee.toFixed(2),
      };
    }
    // ADMIN
    if (admin?.email && admin.id !== user.id && admin.id !== creator?.id) {
      await step.run("email-admin", async () => {
        await sendEmailUsingTemplateWithConditionals({
          toEmail: admin.email,
          toName: admin.name,
          templateId: templates.admin,
          templateData: {
            username: user.name,
            userEmail: maskEmail(user.email ?? ""),
            [nameKey]: entityName,
            creatorName:
              finalEntityType === "STORE"
                ? creators
                    .filter((c) => c.id !== admin?.id)
                    .map((c) => c.name)
                    .join(", ")
                : (creator?.name ?? "Unknown"),
            [urlKey]: adminUrl,

            ...(adminFinancials || financials || {}),

            showRevenueSplit: true,

            perProductBreakdown:
              finalEntityType === "STORE" ? perProductBreakdown : [],
            isMultiCreator:
              finalEntityType === "STORE" && perProductBreakdown.length > 1,

            ...commonChallengeData,
            isStore: finalEntityType === "STORE",
            productName:
              finalEntityType === "STORE"
                ? entityFullNames || entityName
                : null,

            isGP,
            currencySymbol,
            amount:
              adminFinancials && Number(adminFinancials.totalPaid) > 0
                ? adminFinancials.totalPaid
                : null,
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
