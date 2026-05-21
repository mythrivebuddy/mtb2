import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  SubscriptionStatus,
  PaymentContextType,
} from "@prisma/client";

export async function handlePaymentReversal(paymentId: string) {
  return await prisma.$transaction(async (tx) => {
    console.log("🔁 [REVERSAL START] PaymentId:", paymentId);

    /* =========================================
       1️⃣ FIND ORDER
    ========================================= */
    const order = await tx.paymentOrder.findFirst({
      where: { paymentId },
    });

    if (!order) {
      console.warn("⚠️ Order not found for paymentId:", paymentId);
      return { skipped: true, reason: "ORDER_NOT_FOUND" };
    }

    console.log("📦 Order found:", {
      orderId: order.id,
      contextType: order.contextType,
      userId: order.userId,
    });

    /* =========================================
       2️⃣ IDEMPOTENCY CHECK
    ========================================= */
    if (order.status === PaymentStatus.REFUNDED) {
      console.warn("⚠️ Already refunded:", order.id);
      return { skipped: true, reason: "ALREADY_REFUNDED" };
    }

    /* =========================================
       3️⃣ MARK ORDER REFUNDED
    ========================================= */
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    console.log("💸 Payment marked as REFUNDED:", order.id);

    /* =========================================
       4️⃣ CONTEXT-BASED ACCESS REVERSAL
    ========================================= */
    switch (order.contextType) {
      case PaymentContextType.SUBSCRIPTION: {
        console.log("🔓 Reversing SUBSCRIPTION access");

        await tx.subscription.updateMany({
          where: {
            userId: order.userId,
            paymentOrderId: order.id,
          },
          data: {
            status: SubscriptionStatus.CANCELLED,
            endDate: new Date(),
          },
        });
        await tx.user.update({
          where: { id: order.userId },
          data: { membership: "FREE" },
        });

        break;
      }

      case PaymentContextType.MMP_PROGRAM: {
        console.log("📘 Reversing PROGRAM access");
        const programId = order.programId;
        if (!programId) {
            console.log("No program id found for order:", order.id);
            break;
        }
        await tx.oneTimeProgramPurchase.deleteMany({
          where: {
            userId: order.userId,
            productId: programId,
          },
        });
        await tx.userProgramState.deleteMany({
          where: {
            userId: order.userId,
            programId: programId,
          },
        });
        break;
      }

      case PaymentContextType.CHALLENGE: {
        console.log("🏆 Reversing CHALLENGE access");

        // 2. Identify and Clean up Enrollment
        // Based on your Enroll API, we find the enrollment tied to this user and challenge
        if (order.challengeId) {
          const enrollment = await tx.challengeEnrollment.findUnique({
            where: {
              userId_challengeId: {
                userId: order.userId,
                challengeId: order.challengeId,
              },
            },
          });

          if (enrollment) {
            // Delete associated tasks first (if not handled by cascade delete)
            await tx.userChallengeTask.deleteMany({
              where: { enrollmentId: enrollment.id },
            });

            // Delete the enrollment so it disappears from user's active challenges
            await tx.challengeEnrollment.delete({
              where: { id: enrollment.id },
            });
            
            console.log(`✅ Enrollment and tasks deleted for challenge: ${order.challengeId}`);
          }
        }
        break;
      }

      case PaymentContextType.STORE_PRODUCT: {
        console.log("🛒 Reversing STORE order");

        if (order.storeOrderId) {
          await tx.order.update({
            where: { id: order.storeOrderId },
            data: { status: "CANCELLED" },
          });
        } else {
          console.warn("⚠️ No storeOrderId found for order:", order.id);
        }

        break;
      }

      default:
        console.warn("⚠️ Unknown contextType:", order.contextType);
        break;
    }

    /* =========================================
       5️⃣ CREATOR EARNING REVERSAL (CONDITIONAL)
    ========================================= */
    if (
      order.contextType === PaymentContextType.MMP_PROGRAM ||
      order.contextType === PaymentContextType.CHALLENGE ||
      order.contextType === PaymentContextType.STORE_PRODUCT
    ) {
      console.log("💰 Reversing CREATOR earnings");

      const result = await tx.creatorEarningLedger.updateMany({
        where: {
          paymentOrderId: order.id,
          status: { not: "REVERSED" },
        },
        data: {
          status: "REVERSED",
          earnedAmount: 0,
          baseAmount: 0,
          platformFee: 0,
        },
      });

      if (result.count === 0) {
        console.warn("⚠️ No creator earnings found to reverse:", order.id);
      } else {
        console.log("✅ Creator earnings reversed:", result.count);
      }
    }

    /* =========================================
       6️⃣ AFFILIATE EARNING REVERSAL (SAFE)
    ========================================= */

    const affiliateResult = await tx.affiliateEarningLedger.updateMany({
      where: {
        paymentOrderId: order.id,
        status: { not: "REVERSED" },
      },
      data: {
        status: "REVERSED",
        earnedAmount: 0,
        baseAmount: 0,
        discountAmount: 0,
      },
    });

    if (affiliateResult.count === 0) {
      console.log("ℹ️ No affiliate earnings to reverse");
    } else {
      console.log("✅ Affiliate earnings reversed:", affiliateResult.count);
    }

    console.log("✅ [REVERSAL COMPLETE] Order:", order.id);

    return { success: true };
  });
}
