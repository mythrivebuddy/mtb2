import { PaymentOrder, Prisma } from "@prisma/client";

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
        },
      },
    },
  });
   const allItemIds = items
  .filter(
    () =>
      order.currency !== "GP", //! exclude GP admin items
  )
  .map((item) => item.id);

  console.log("✅ Admin Item IDs:", allItemIds);
  return { allItemIds };
}
