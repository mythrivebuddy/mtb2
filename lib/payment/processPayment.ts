import { PaymentOrder, Prisma } from "@prisma/client";
import { handleChallengePayment } from "./handlers/challengeHandler";
import { handleProgramPayment } from "./handlers/programHandler";
import { handleStorePayment } from "./handlers/storeHandler";

type ProcessPaymentResult = {
  isAdmin?: boolean;
  allItemIds?: string[];
};

export async function processPayment(tx: Prisma.TransactionClient, order: PaymentOrder) :Promise<ProcessPaymentResult>{

    if (order.challengeId) {
        return handleChallengePayment(tx, order);
    }

    if (order.programId) {
        return handleProgramPayment(tx, order);
    }

    if (order.contextType === "STORE_PRODUCT") {
        return handleStorePayment(tx, order);
    }
    return { isAdmin: false, allItemIds: [] };
}