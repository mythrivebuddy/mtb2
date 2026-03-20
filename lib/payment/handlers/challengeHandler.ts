import { PaymentOrder, PaymentStatus, Prisma } from "@prisma/client";

export async function handleChallengePayment(
    tx: Prisma.TransactionClient,
    order: PaymentOrder
) {

    if (!order.challengeId) return;

  await tx.challengePayment.upsert({
  where: {
    userId_challengeId: {
      userId: order.userId,
      challengeId: order.challengeId,
    },
  },
  update: {
    status: PaymentStatus.PAID,
    amountPaid: order.totalAmount,
    paidAt: new Date(),
  },
  create: {
    userId: order.userId,
    challengeId: order.challengeId,
    paymentOrderId: order.id,
    amountPaid: order.totalAmount,
    currency: order.currency,
    status: PaymentStatus.PAID,
    paidAt: new Date(),
  },
});
    if (order.couponId) {

        const existing = await tx.couponRedemption.findFirst({
            where: {
                couponId: order.couponId,
                userId: order.userId,
                appliedPlan: "CHALLENGE",
            },
        });
        if (!existing) {
            await tx.couponRedemption.create({
                data: {
                    couponId: order.couponId,
                    userId: order.userId,
                    redeemed: true,
                    appliedPlan: "CHALLENGE",
                    discountApplied: order.discountApplied, // optional if you store exact discount
                },
            });
        }
    }

}