import { prisma } from "@/lib/prisma";

export async function validateCoupon({
    couponCode,
    scope,
    entityId,
}: {
    couponCode?: string;
    scope: "CHALLENGE" | "MMP_PROGRAM" | "STORE_PRODUCT";
    entityId: string;
}) {
    if (!couponCode) return null;
    console.log(entityId);
    const coupon = await prisma.coupon.findFirst({
        where: {
            couponCode: couponCode.toUpperCase(),
            status: "ACTIVE",
            scope,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
        },
    });

    return coupon ?? null;
}