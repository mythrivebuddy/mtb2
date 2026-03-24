import { PaymentOrder, Prisma } from "@prisma/client";
import { convertCurrency } from "../payment.utils";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";

export async function handleStorePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
) {
  if (order.storeOrderId) return;

  const storeOrder = await tx.order.create({
    data: {
      userId: order.userId,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: "COMPLETED",
    },
  });

  const cart = order.cartSnapshot as { itemId: string; quantity: number }[];

  for (const cartItem of cart) {
    const item = await tx.item.findUnique({
      where: { id: cartItem.itemId },
    });

    if (!item) continue;

    let price = item.basePrice ?? 0;

    if (item.currency !== order.currency) {
      price = await convertCurrency(
        price,
        item.currency as "INR" | "USD",
        order.currency as "INR" | "USD",
      );
    }

    await tx.orderItem.create({
      data: {
        orderId: storeOrder.id,
        itemId: item.id,
        quantity: cartItem.quantity,

        priceAtPurchase: order.totalAmount,
        originalPrice: item.basePrice,
        originalCurrency: item.currency,
      },
    });
  }

  await tx.paymentOrder.update({
    where: { id: order.id },
    data: {
      storeOrderId: storeOrder.id,
    },
  });
  if (order.couponId) {
    await tx.couponRedemption.create({
      data: {
        couponId: order.couponId,
        userId: order.userId,
        redeemed: true,
        usedAt: new Date(),
        appliedPlan: "STORE_PRODUCT",
        discountApplied: order.discountApplied ?? 0,
      },
    });
  }
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
        orderUrl: `${appUrl}/dashboard/store/profile`,
        currency: order.currency,
        paymentDetails: `Paid with Razorpay (${order.currency})`,
      },
    });
  }
}
