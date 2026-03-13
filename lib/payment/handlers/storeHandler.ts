import { PaymentOrder, Prisma } from "@prisma/client";
import { convertCurrency } from "../payment.utils";

export async function handleStorePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder
) {

  if (order.storeOrderId) return;

  const storeOrder = await tx.order.create({
    data: {
      userId: order.userId,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: "COMPLETED"
    }
  });

  const cart = order.cartSnapshot as { itemId: string; quantity: number }[];

  for (const cartItem of cart) {

  const item = await tx.item.findUnique({
    where: { id: cartItem.itemId }
  });

  if (!item) continue;

  let price = item.basePrice ?? 0;

  if (item.currency !== order.currency) {
    price = await convertCurrency(
      price,
      item.currency as "INR" | "USD",
      order.currency as "INR" | "USD"
    );
  }

  await tx.orderItem.create({
    data: {
      orderId: storeOrder.id,
      itemId: item.id,
      quantity: cartItem.quantity,

      priceAtPurchase: price,
      originalPrice: item.basePrice,
      originalCurrency: item.currency
    }
  });
}

  await tx.paymentOrder.update({
    where: { id: order.id },
    data: {
      storeOrderId: storeOrder.id
    }
  });

}