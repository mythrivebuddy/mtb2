import { PaymentOrder, Prisma } from "@prisma/client";
import { handleChallengePayment } from "./handlers/challengeHandler";
import { handleProgramPayment } from "./handlers/programHandler";
import { handleStorePayment } from "./handlers/storeHandler";
import { handleHostedEventPayment } from "./handlers/hostedEventHandler";

type ProcessPaymentResult = {
  isAdmin?: boolean;
  allItemIds?: string[];
  adminItemIds?: string[]; 
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
        if (order.contextType === "HOSTED_EVENT") {
        return handleHostedEventPayment(tx, order);
    }
    return { isAdmin: false, allItemIds: [], adminItemIds: [] };
}