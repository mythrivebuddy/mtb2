import { PaymentOrder, PaymentStatus, Prisma } from "@prisma/client";

export async function handleProgramPayment(
    tx: Prisma.TransactionClient,
    order: PaymentOrder
) {

    if (!order.programId) return;

    const program = await tx.program.findUnique({
        where: { id: order.programId },
    });

    if (!program) {
        throw new Error("Program not found");
    }
    // 2️⃣ Prevent duplicate webhook processing
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
    }

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

}