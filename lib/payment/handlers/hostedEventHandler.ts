import { PaymentOrder, Prisma, Role } from "@prisma/client";

type ProcessPaymentResult = {
  isAdmin?: boolean;
  allItemIds?: string[];
  adminItemIds?: string[];
};

export async function handleHostedEventPayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder
): Promise<ProcessPaymentResult> {

  const eventId = order.hostedEventId;

  if (!eventId) {
    console.error("hostedEventHandler: missing hostedEventId on order", order.id);
    return { isAdmin: false, allItemIds: [], adminItemIds: [] };
  }

  // ---------------------------
  // 1. FETCH EVENT + CREATOR
  // ---------------------------
  const event = await tx.hostedEvent.findUnique({
    where: { id: eventId },
    include: {
      creator: {
        select: {
          id: true,
          role: true,
          membership: true,
          userType: true,
        },
      },
      tickets: true,
    },
  });

  if (!event) {
    throw new Error(`Hosted event not found: ${eventId}`);
  }

  const ticket = event.tickets?.[0];
  if (!ticket) {
    throw new Error(`No ticket found for event ${eventId}`);
  }

  // ---------------------------
  // 2. IDEMPOTENT ENROLLMENT
  // ---------------------------
  const existing = await tx.hostedEventEnrollment.findUnique({
    where: {
      userId_eventId: {
        userId: order.userId,
        eventId,
      },
    },
  });

  if (!existing) {
    await tx.hostedEventEnrollment.create({
      data: {
        userId: order.userId,
        eventId,
        ticketId: ticket.id,
      },
    });
  }

  // ---------------------------
  // 3. COUPON REDEMPTION
  // ---------------------------
  if (order.couponId) {
    const existingRedemption = await tx.couponRedemption.findFirst({
      where: {
        couponId: order.couponId,
        userId: order.userId,
        appliedPlan: "EVENT",
      },
    });

    if (!existingRedemption) {
      await tx.couponRedemption.create({
        data: {
          couponId: order.couponId,
          userId: order.userId,
          redeemed: true,
          appliedPlan: "EVENT",
          discountApplied: order.discountApplied,
        },
      });
    }
  }

  // ---------------------------
  // 4. SKIP IF ADMIN CREATOR
  // ---------------------------
  if (!event.creator) {
    return { isAdmin: false, allItemIds: [], adminItemIds: [] };
  }

  const role = event.creator.role as Role;
  if (role === Role.ADMIN) {
    return {
      isAdmin: true,
      allItemIds: [eventId],
      adminItemIds: [eventId],
    };
  }

  if (!event.creatorId) {
    return {
      isAdmin: true,
      allItemIds: [eventId],
      adminItemIds: [eventId],
    };
  }

  // ---------------------------
  // 5. COMMISSION CONFIG
  // ---------------------------
//   const feature = await tx.feature.findFirst({
//     where: { key: "hostedEvents" }, // adjust key to match your Feature table
//   });

//   const creatorUserType = normalizeUserType(event.creator.userType);
//   if (!creatorUserType) {
//     return { isAdmin: false, allItemIds: [], adminItemIds: [] };
//   }

//   const featureConfig = await tx.featurePlanConfig.findFirst({
//     where: {
//       featureId: feature?.id,
//       membership: event.creator.membership,
//       userType: creatorUserType,
//       isActive: true,
//     },
//   });

//   const config = featureConfig?.config as {
//     commissionPercent?: number;
//   } | null;

//   const commissionPercent = Number(config?.commissionPercent ?? 0);

//   // ---------------------------
//   // 6. FINANCIAL CALCULATION
//   // ---------------------------
//   const baseAmount = order.baseAmount ?? order.totalAmount;
//   const discountAmount = order.discountApplied ?? 0;
//   const netAmount = Math.max(0, baseAmount - discountAmount);
//   const platformFee = (netAmount * commissionPercent) / 100;
//   const earnedAmount = netAmount - platformFee;

//   // ---------------------------
//   // 7. LEDGER ENTRY (idempotent)
//   // ---------------------------
//   await tx.creatorEarningLedger.upsert({
//     where: {
//       paymentOrderId_contextId_contextType_currency: {
//         paymentOrderId: order.id,
//         contextId: eventId,
//         contextType: "HOSTED_EVENT",
//         currency: order.currency,
//       },
//     },
//     update: {},
//     create: {
//       creatorId: event.creatorId,
//       paymentOrderId: order.id,
//       contextId: eventId,
//       contextType: "HOSTED_EVENT",
//       baseAmount,
//       discountAmount,
//       commissionRate: commissionPercent,
//       platformFee,
//       earnedAmount,
//       currency: order.currency,
//       status: "PENDING",
//     },
//   });

  return {
    isAdmin: false,
    allItemIds: [eventId],
    adminItemIds: [],
  };
}