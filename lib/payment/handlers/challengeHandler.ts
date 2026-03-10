import { PaymentOrder, PaymentStatus, Prisma } from "@prisma/client";

export async function handleChallengePayment(
    tx: Prisma.TransactionClient,
    order: PaymentOrder
) {

    if (!order.challengeId) return;

    await tx.challengePayment.create({
        data: {
            userId: order.userId,
            challengeId: order.challengeId,
            paymentOrderId: order.id,
            amountPaid: order.totalAmount,
            currency: order.currency,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
        },
    });

}