import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import { PaymentOrder, PaymentStatus, Prisma, Role } from "@prisma/client";

export async function handleProgramPayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ isAdmin: boolean; allItemIds: string[] }> {
  if (!order.programId) return { isAdmin: false, allItemIds: [] };

  const program = await tx.program.findUnique({
    where: { id: order.programId },
    include: {
      creator: {
        select: {
          id: true,
          role: true,
          membership: true, 
          userType: true,
        },
      },
    },
  });

  if (!program) {
    throw new Error("Program not found");
  }
  // ! Prevent duplicate webhook processing
  const existingPayment = await tx.miniMasteryProgramPayment.findUnique({
    where: {
      paymentOrderId: order.id,
    },
  });

  if (!existingPayment) {
    // 3️⃣ Insert payment record
    await tx.miniMasteryProgramPayment.create({
      data: {
        userId: order.userId,
        programId: program.id,
        paymentOrderId: order.id,

        amountPaid: order.totalAmount,
        currency: order.currency,

        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
    await tx.userProgramState.upsert({
      where: {
        userId_programId: {
          userId: order.userId,
          programId: program.id,
        },
      },
      update: {},
      create: {
        userId: order.userId,
        programId: program.id,
        onboarded: true,
        onboardedAt: new Date(),
      },
    });
    if (order.couponId) {
      const existing = await tx.couponRedemption.findFirst({
        where: {
          couponId: order.couponId,
          userId: order.userId,
          appliedPlan: "MMP_PROGRAM",
        },
      });

      if (!existing) {
        await tx.couponRedemption.create({
          data: {
            couponId: order.couponId,
            userId: order.userId,
            redeemed: true,
            appliedPlan: "MMP_PROGRAM",
            discountApplied: order.discountApplied,
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────
  // 2. Skip platform products (ADMIN)
  // ─────────────────────────────────────────────
  if (!program.creator) {
    return { isAdmin: false, allItemIds: [] };
  }
  const role = program.creator.role as Role;
  if (role === Role.ADMIN) {
    return {
      isAdmin: true,
      allItemIds: [program.id],
    };
  }
  if (!program.createdBy) {
    return {
      isAdmin: true,
      allItemIds: [program.id],
    };
  }
  // ─────────────────────────────────────────────
  // 3. Get commission config (feature-based)
  // ─────────────────────────────────────────────
  const feature = await tx.feature.findFirst({
    where: { key: "miniMasteryPrograms" },
  });

  const creatorUserType = normalizeUserType(program.creator.userType);
  if (!creatorUserType) {
    return { isAdmin: false, allItemIds: [] };
  }

  const featureConfig = await tx.featurePlanConfig.findFirst({
    where: {
      featureId: feature?.id,
      membership: program.creator.membership,
      userType: creatorUserType,
      isActive: true,
    },
  });

  const config = featureConfig?.config as {
    commissionPercent?: number;
  } | null;

  const commissionPercent = Number(config?.commissionPercent ?? 0);

  // ─────────────────────────────────────────────
  // 4. Financial calculation (IMPORTANT)
  // ─────────────────────────────────────────────
  const baseAmount =
    (order.baseAmount ?? order.totalAmount) - (order.discountApplied ?? 0);

  const platformFee = (baseAmount * commissionPercent) / 100;
  const earnedAmount = baseAmount - platformFee;

  // ─────────────────────────────────────────────
  // 5. Ledger entry (idempotent)
  // ─────────────────────────────────────────────
  await tx.creatorEarningLedger.upsert({
    where: {
      paymentOrderId_contextId_contextType_currency: {
        paymentOrderId: order.id,
        contextId: order.programId,
        contextType: "MMP_PROGRAM",
        currency: order.currency,
      },
    },
    update: {},
    create: {
      creatorId: program.createdBy,
      paymentOrderId: order.id,
      contextId: order.programId,
      contextType: "MMP_PROGRAM",

      baseAmount,
      commissionRate: commissionPercent,
      platformFee,
      earnedAmount,

      currency: order.currency,
      status: "PENDING",
    },
  });

  return {
    isAdmin: false,
    allItemIds: [program.id],
  };
}
