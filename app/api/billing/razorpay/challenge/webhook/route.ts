import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
import { PaymentStatus } from "@prisma/client";
import { processPayment } from "@/lib/payment/processPayment";
import { inngest } from "@/lib/inngest";
import { createAffiliateEarningForSubscription } from "@/lib/affiliate/affiliateEarning";
import { handlePaymentReversal } from "@/lib/payment/handlePaymentReversal";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const { razorpayWebhookSecret } = await getRazorpayConfig();

    const expectedSignature = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.event === "refund.processed") {
      const entity =
        event.payload.refund?.entity || event.payload.dispute?.entity;
      const paymentId = entity?.payment_id;

      if (paymentId) {
        await handlePaymentReversal(paymentId);
        return NextResponse.json(
          { received: true, message: "Payment refund event fires" },
          { status: 200 },
        );
      }
      return new NextResponse("Payment ID not found in reversal", {
        status: 400,
      });
    }

    if (event.event !== "payment.captured") {
      return new NextResponse("Event ignored", { status: 200 });
    }

    const payment = event.payload?.payment?.entity;

    if (!payment) {
      return new NextResponse("Invalid payload", { status: 400 });
    }
    if (payment.subscription_id) {
      return new NextResponse("Subscription payment - ignored here", {
        status: 200,
      });
    }
    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    const existingOrder = await prisma.paymentOrder.findFirst({
      where: { razorpayOrderId },
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 200 });
    }

    if (existingOrder.status === PaymentStatus.PAID) {
      return new NextResponse("Already processed", { status: 200 });
    }
    if (existingOrder.contextType === "SUBSCRIPTION") {
      return new NextResponse("Subscription payment - ignored here", {
        status: 200,
      });
    }
    let paymentMeta: {
      isAdmin?: boolean;
      allItemIds?: string[];
      adminItemIds?: string[];
    } = {};

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.paymentOrder.update({
          where: { id: existingOrder.id },
          data: {
            status: PaymentStatus.PAID,
            paymentId,
            paidAt: new Date(),
          },
        });

        paymentMeta = await processPayment(tx, updated);
        return updated;
      },
      { timeout: 60000 },
    ); // 60 seconds timeout for the entire transaction
    try {
      await createAffiliateEarningForSubscription({
        tx: prisma,
        order: {
          id: updatedOrder.id,
          userId: updatedOrder.userId,
          totalAmount: updatedOrder.totalAmount,
          baseAmount: updatedOrder.baseAmount,
          gstAmount: updatedOrder.gstAmount,
          discountApplied: updatedOrder.discountApplied,
          currency: updatedOrder.currency,
          contextType: updatedOrder.contextType,
        },
        isAdmin: paymentMeta.isAdmin,
        adminItemIds: paymentMeta.adminItemIds || [],
      });
    } catch (err) {
      console.error("Affiliate creation failed (ignored):", err);
    }
    try {
      try {
        if (inngest && typeof inngest.send === "function") {
          await new Promise((res) => setTimeout(res, 500));
          const isStorePurchase = existingOrder.contextType === "STORE_PRODUCT";
          await inngest.send({
            name: "invoice/send",
            id: `invoice-${existingOrder.id}`,
            data: {
              orderId: existingOrder.id,
              ...(isStorePurchase &&
                paymentMeta.allItemIds?.length && {
                  itemIds: paymentMeta.allItemIds,
                }),
            },
          });

          // notify-creator-admin
        
          await inngest.send({
            name: "mmp-challenge-store.notify",
            id: `notify-${existingOrder.id}`,
            data: {
              userId: existingOrder.userId,
              orderId: existingOrder.id,
              seId: existingOrder.userId,
              isFree: false, // paid flow
              entityType: existingOrder.contextType,
            },
          });
        
          // ✅ PROGRAM REMINDER TRIGGER
          try {
            if (existingOrder.programId) {
              const user = await prisma.user.findUnique({
                where: { id: existingOrder.userId },
                select: { timezone: true },
              });

              if (user?.timezone) {
                await inngest.send({
                  name: "mmp-program/reminder.start",

                  id: `mmp-program-reminder-${existingOrder.userId}`,

                  data: {
                    userId: existingOrder.userId,
                    // programId: existingOrder.programId,
                    timezone: user.timezone,
                  },
                });
              } else {
                console.warn("⚠️ User timezone missing, skipping reminder");
              }
            }
          } catch (err) {
            console.error("Program reminder scheduling failed:", err);
          }
        } else {
          console.warn("Inngest not configured, skipping event");
        }
      } catch (err) {
        console.error("Inngest failed (ignored):", err);
      }
    } catch (err) {
      console.error("Inngest failed (ignored):", err);
    }
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
