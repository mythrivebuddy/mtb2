import { PaymentOrder, PaymentStatus, Prisma } from "@prisma/client";

export async function handleProgramPayment(
  tx: Prisma.TransactionClient,
  order: PaymentOrder,
): Promise<{ isAdmin: boolean }> {
  if (!order.programId) return { isAdmin: false };

  const program = await tx.program.findUnique({
    where: { id: order.programId },
    include: {
      creator: {
        select: {
          id: true,
          role: true,
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
  return {
    isAdmin: program.creator?.role === "ADMIN",
  };
}
