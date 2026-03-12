import { prisma } from "@/lib/prisma";

export async function createPaymentOrder(data: {
    userId: string;
    contextType: "CHALLENGE" | "STORE_PRODUCT" | "MMP_PROGRAM";
    entityId: string;
    razorpayOrderId: string;
    baseAmount: number;
    discount: number;
    gst: number;
    totalAmount: number;
    currency: string;
    couponId?: string | null;
    billingInfoId: string;
    programId?: string | null;
}) {
    return prisma.paymentOrder.create({
        data: {
            userId: data.userId,
            contextType: data.contextType,
            razorpayOrderId: data.razorpayOrderId,
            orderId: data.razorpayOrderId,
            baseAmount: data.baseAmount,
            discountApplied: data.discount,
            gstAmount: data.gst,
            totalAmount: data.totalAmount,
            couponId: data.couponId ?? null,
            currency: data.currency,
            status: "PENDING",
            billingInfoId: data.billingInfoId,
            programId: data.programId ?? null,
            challengeId:
                data.contextType === "CHALLENGE" ? data.entityId : undefined,
                storeOrderId:
        data.contextType === "STORE_PRODUCT" ? data.entityId : undefined,
        },
    });
}