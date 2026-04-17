import { PaymentOrder, PaymentStatus, Prisma } from "@prisma/client";

export async function handleChallengePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ isAdmin: boolean,allItemIds:string[] }> {
  if (!order.challengeId) return { isAdmin: false,allItemIds:[] };
  const challenge = await tx.challenge.findUnique({
    where: { id: order.challengeId },
    select: {
      creator: {
        select: {
          role: true,
        },
      },
    },
  });
  console.log("🎯 Challenge Payment");
console.log("Creator Role:", challenge?.creator?.role);
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
          discountApplied: order.discountApplied, // optional if we store exact discount
        },
      });
    }
  }
  return {
    isAdmin: challenge?.creator?.role === "ADMIN",
    allItemIds:[order.challengeId],
  };
}
