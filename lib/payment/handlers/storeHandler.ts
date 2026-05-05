import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import { PaymentOrder, Prisma, Role } from "@prisma/client";

export async function handleStorePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ allItemIds: string[] }> {
  if (order.storeOrderId) return { allItemIds: [] };

  const storeOrder = await tx.order.create({
    data: {
      userId: order.userId,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: "COMPLETED",
    },
  });

  const cart = order.cartSnapshot as {
    itemId: string;
    quantity: number;
    price: number;
    discount: number;
    finalPrice: number;
    currency: string;
  }[];

  await tx.orderItem.createMany({
    data: cart.map((cartItem) => ({
      orderId: storeOrder.id,
      itemId: cartItem.itemId,
      quantity: cartItem.quantity,
      priceAtPurchase: cartItem.finalPrice,
      originalPrice: cartItem.price,
      originalCurrency: cartItem.currency,
    })),
  });

  // 2. Coupon redemption
  const couponData = cart
    .filter((c) => order.couponId && c.discount > 0)
    .map((c) => ({
      couponId: order.couponId!,
      userId: order.userId,
      redeemed: true,
      usedAt: new Date(),
      appliedPlan: "STORE_PRODUCT",
      discountApplied: c.discount,
      currency: c.currency,
    }));

  if (couponData.length) {
    await tx.couponRedemption.createMany({ data: couponData });
  }
  await tx.cart.deleteMany({
    where: {
      userId: order.userId,
      itemId: {
        in: cart.map((c) => c.itemId),
      },
    },
  });
  await tx.paymentOrder.update({
    where: { id: order.id },
    data: {
      storeOrderId: storeOrder.id,
    },
  });

  const items = await tx.item.findMany({
    where: {
      id: { in: cart.map((c) => c.itemId) },
    },
    select: {
      id: true,
      creator: {
        select: {
          id: true,
          role: true,
          membership: true,
          userType: true,
        },
      },
    },
  });

  // 6. Feature config (store)
  // ─────────────────────────────────────────────
  const feature = await tx.feature.findFirst({
    where: { key: "store" },
  });

  // ─────────────────────────────────────────────
  // 7. Create ledger per item
  // ─────────────────────────────────────────────
  for (const cartItem of cart) {
    const item = items.find((i) => i.id === cartItem.itemId);
    if (!item || !item.creator) continue;

    // ❌ skip admin items
    if ((item.creator.role as Role) === Role.ADMIN) continue;

    const creatorUserType = normalizeUserType(item.creator?.userType);
    if (!creatorUserType) continue;

    const featureConfig = await tx.featurePlanConfig.findFirst({
      where: {
        featureId: feature?.id,
        membership: item.creator.membership,
        userType: creatorUserType,
        isActive: true,
      },
    });

    const config = featureConfig?.config as {
      commissionPercent?: number;
    } | null;

    const commissionPercent = Number(config?.commissionPercent ?? 0);

    // 💰 PER ITEM calculation
    const baseAmount =
      cartItem.price * (cartItem.quantity ?? 1) - (cartItem.discount ?? 0);

    if (!baseAmount || baseAmount <= 0) continue;

    const platformFee = (baseAmount * commissionPercent) / 100;
    const earnedAmount = baseAmount - platformFee;

    // 🔥 ledger (idempotent)
    await tx.creatorEarningLedger.upsert({
      where: {
        paymentOrderId_contextId_contextType_currency: {
          paymentOrderId: order.id,
          contextId: cartItem.itemId,
          contextType: "STORE_PRODUCT",
          currency: order.currency,
        },
      },
      update: {},
      create: {
        creatorId: item.creator.id,
        paymentOrderId: order.id,
        contextId: cartItem.itemId,
        contextType: "STORE_PRODUCT",

        baseAmount,
        commissionRate: commissionPercent,
        platformFee,
        earnedAmount,

        currency: order.currency,
        status: "PENDING",
      },
    });
  }

  const allItemIds = items
    .filter(
      () => order.currency !== "GP", //! exclude GP admin items
    )
    .map((item) => item.id);

  console.log("✅ Admin Item IDs:", allItemIds);
  return { allItemIds };
}
