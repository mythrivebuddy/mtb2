import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import { PaymentOrder, PaymentStatus, Prisma, Role } from "@prisma/client";

export async function handleChallengePayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ isAdmin: boolean; allItemIds: string[] }> {
  if (!order.challengeId) return { isAdmin: false, allItemIds: [] };
  const challenge = await tx.challenge.findUnique({
    where: { id: order.challengeId },
    select: {
      creatorId: true,
      creator: {
        select: {
          role: true,
          membership: true,
          userType: true,
        },
      },
    },
  });
  if (!challenge) {
    return { isAdmin: false, allItemIds: [] };
  }

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
  const role = challenge.creator.role as Role;

  if (role === Role.ADMIN) {
    return {
      isAdmin: true,
      allItemIds: [order.challengeId],
    };
  }
  const feature = await tx.feature.findFirst({
    where: { key: "challenges" },
  });
  const creatorUserType = normalizeUserType(challenge.creator.userType);
  if (!creatorUserType) {
    return { isAdmin: false, allItemIds: [] };
  }
  const featureConfig = await tx.featurePlanConfig.findFirst({
    where: {
      featureId: feature?.id,
      membership: challenge.creator.membership,
      userType: creatorUserType,
      isActive: true,
    },
  });

  const config = featureConfig?.config as { commissionPercent?: number } | null;

  const commissionPercent = Number(config?.commissionPercent ?? 0);
  // ✅ 4. Compute financials
  const baseAmount = order.baseAmount ?? order.totalAmount; // Pre-discount (Gross)
  const discountAmount = order.discountApplied ?? 0;
  
  // The amount the platform fee is actually calculated on (Net Amount)
  const netAmount = Math.max(0, baseAmount - discountAmount); 

  const platformFee = (netAmount * commissionPercent) / 100;
  const earnedAmount = netAmount - platformFee;

  // ✅ 5. Create ledger (idempotent)
  await tx.creatorEarningLedger.upsert({
    where: {
      paymentOrderId_contextId_contextType_currency: {
        paymentOrderId: order.id,
        contextId: order.challengeId,
        contextType: "CHALLENGE",
        currency: order.currency,
      },
    },
    update: {}, // do nothing if already exists
    create: {
      creatorId: challenge.creatorId,
      paymentOrderId: order.id,
      contextId: order.challengeId,
      contextType: "CHALLENGE",

      baseAmount,
      discountAmount,
      commissionRate: commissionPercent,
      platformFee,
      earnedAmount,

      currency: order.currency,
      status: "PENDING",
    },
  });

  return {
    isAdmin: challenge.creator.role === Role.ADMIN,
    allItemIds: [order.challengeId],
  };
}
