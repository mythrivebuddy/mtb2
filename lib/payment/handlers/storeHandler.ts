import { PaymentOrder, Prisma } from "@prisma/client";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";

export async function handleStorePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ adminItemIds: string[] }> {
  if (order.storeOrderId) return { adminItemIds: [] };

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

  const user = await tx.user.findUnique({
    where: { id: order.userId },
    select: { email: true, name: true },
  });
  const orderItems = await tx.orderItem.findMany({
    where: { orderId: storeOrder.id },
    include: {
      item: {
        select: { name: true },
      },
    },
  });
  const orderDate = new Date(storeOrder.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemNames = orderItems
    .map(
      (i) =>
        `${i.item.name} (×${i.quantity}) - ${i.priceAtPurchase} ${order.currency}`,
    )
    .join(", ");

  const appUrl = process.env.NEXT_URL || "";

  if (user?.email) {
    void sendEmailUsingTemplate({
      toEmail: user.email,
      toName: user.name ?? "Customer",
      templateId: "order-placed",
      templateData: {
        username: user.name ?? "Customer",
        orderId: storeOrder.id,
        orderDate,
        totalAmount: `${order.totalAmount} ${order.currency}`,
        status: "COMPLETED",
        itemCount: orderItems.length,
        itemNames,
        orderUrl: `${appUrl}/dashboard/store/order-history`,
        currency: order.currency,
        paymentDetails: `Paid with Razorpay (${order.currency})`,
      },
    });
  }
  const items = await tx.item.findMany({
    where: {
      id: { in: cart.map((c) => c.itemId) },
    },
    select: {
      id: true,
      creator: {
        select: {
          role: true,
          createdByRole: true,
        },
      },
    },
  });
  console.log("📦 Store Items:", items);
  const adminItemIds = items
    .filter((item) => item.creator?.role === "ADMIN")
    .map((item) => item.id);
  console.log("✅ Admin Item IDs:", adminItemIds);
  return {se adminItemIds };
}
