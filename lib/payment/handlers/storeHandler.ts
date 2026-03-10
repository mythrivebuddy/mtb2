import { PaymentOrder, Prisma } from "@prisma/client";

export async function handleStorePayment(
    tx: Prisma.TransactionClient,
    order: PaymentOrder
) {

    if (!order.storeOrderId) return;

    /**
     * TODO
     * Implement store order completion logic.
     *
     * Example:
     *
     * await tx.order.update({
     *   where: { id: order.storeOrderId },
     *   data: { status: "PAID" }
     * })
     */

}