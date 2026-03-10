import { PaymentOrder, Prisma } from "@prisma/client";
import { handleChallengePayment } from "./handlers/challengeHandler";
import { handleProgramPayment } from "./handlers/programHandler";
import { handleStorePayment } from "./handlers/storeHandler";


export async function processPayment(tx: Prisma.TransactionClient, order: PaymentOrder) {

    if (order.challengeId) {
        return handleChallengePayment(tx, order);
    }

    if (order.programId) {
        return handleProgramPayment(tx, order);
    }

    if (order.storeOrderId) {
        return handleStorePayment(tx, order);
    }

}