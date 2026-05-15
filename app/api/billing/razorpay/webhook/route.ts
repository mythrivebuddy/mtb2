// /api/billing/razorpay/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import {
  getRazorpayConfig,
  verifyRazorpaySignature,
} from "@/lib/razorpay/razorpay";
import { inngest } from "@/lib/inngest";
import Razorpay from "razorpay";
import { createAffiliateEarningForSubscription } from "@/lib/affiliate/affiliateEarning";
import { handlePaymentReversal } from "@/lib/payment/handlePaymentReversal";

export const POST = async (req: NextRequest) => {
  try {
    const { razorpayWebhookSecret: webhookSecret } = await getRazorpayConfig();

    if (!webhookSecret) {
      console.error("❌ Missing RAZORPAY_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    // ✅ RAW BODY REQUIRED
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error("❌ Invalid Razorpay signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    /* ========================================================= */
    /* 🔵 ONE-TIME PAYMENT SUCCESS (LIFETIME UPGRADE FIX)        */
    /* ========================================================= */
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      if (payment.status !== "captured")
        return NextResponse.json({ received: true });
      // ✅ Ignore subscription payments

      if (!payment.order_id) return NextResponse.json({ received: true });
      if (payment.subscription_id) {
        const order = await prisma.paymentOrder.findFirst({
          where: { razorpaySubscriptionId: payment.subscription_id },
          include: { plan: true },
        });

        if (!order || order.status === PaymentStatus.PAID) {
          return NextResponse.json({ received: true });
        }
        if (!order) {
          console.error(
            "Order not found for subscription",
            payment.subscription_id,
          );
          return NextResponse.json({ received: true });
        }
        if (!order.planId || !order?.plan) {
          console.error("Subscription order missing plan relation");
          return NextResponse.json({ received: true });
        }

        // ✅ THIS IS REAL SUCCESS
        await prisma.$transaction(async (tx) => {
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: {
              status: PaymentStatus.PAID,
              paymentId: payment.id,
              paymentMethod: payment.method,
              paidAt: new Date(payment.created_at * 1000),
            },
          });

          await tx.subscription.updateMany({
            where: { userId: order.userId },
            data: { status: SubscriptionStatus.ACTIVE },
          });

          await tx.user.update({
            where: { id: order.userId },
            data: { membership: "PAID" },
          });
        });
        await createAffiliateEarningForSubscription({
          tx: prisma,
          order: {
            id: order.id,
            userId: order.userId,
            totalAmount: order.totalAmount,
            baseAmount: order.baseAmount,
            gstAmount: order.gstAmount,
            discountApplied: order.discountApplied,
            currency: order.currency,
            contextType: order.contextType,
          },
          isAdmin: true,
        });
        return NextResponse.json({ received: true });
      }

      // 🔎 Use Razorpay order_id to find our paymentOrder
      const order = await prisma.paymentOrder.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });

      if (!order || order.status === PaymentStatus.PAID)
        return NextResponse.json({ received: true });
      const redemption = order.couponId
        ? await prisma.couponRedemption.findFirst({
            where: {
              couponId: order.couponId,
              userId: order.userId,
            },
          })
        : null;

      await prisma.$transaction(async (tx) => {
        // 1️⃣ Mark payment order as PAID
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: PaymentStatus.PAID,
            paymentId: payment.id,
            paymentMethod: payment.method,
            paidAt: new Date(payment.created_at * 1000),
          },
        });

        // 🔑 COUPON REDEMPTION — MUST BE HERE
        if (order.couponId && (!redemption || !redemption.redeemed)) {
          if (!redemption) {
            await tx.couponRedemption.create({
              data: {
                couponId: order.couponId,
                userId: order.userId,
                appliedPlan: order.planId as string,
                discountApplied: order.discountApplied,
                redeemed: true,
              },
            });
          } else {
            await tx.couponRedemption.update({
              where: { id: redemption.id },
              data: { redeemed: true },
            });
          }
        }

        // 2️⃣ Create or Update Subscription (LIFETIME)
        const existingSub = await tx.subscription.findFirst({
          where: { userId: order.userId },
        });

        const lifetimeEndDate = new Date(
          new Date().setFullYear(new Date().getFullYear() + 99),
        );

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: order.planId as string,
              status: SubscriptionStatus.ACTIVE,
              razorpaySubscriptionId: null, // IMPORTANT
              startDate: new Date(),
              endDate: lifetimeEndDate,
              renewedAt: null,
              paymentOrderId: order.id,
            },
          });
          // Cancel any mandates with the same (old) subscription id
          if (existingSub.mandateId) {
            await tx.mandate.updateMany({
              where: { id: existingSub.mandateId },
              data: { status: "CANCELLED", nextBillingDate: null },
            });
          }
        } else {
          await tx.subscription.create({
            data: {
              userId: order.userId,
              planId: order.planId as string,
              status: SubscriptionStatus.ACTIVE,
              startDate: new Date(),
              endDate: lifetimeEndDate,
              paymentOrderId: order.id,
            },
          });
        }

        // 3️⃣ Update user membership
        await tx.user.update({
          where: { id: order.userId },
          data: { membership: "PAID" },
        });
      });
      await createAffiliateEarningForSubscription({
        tx: prisma,
        order: {
          id: order.id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          baseAmount: order.baseAmount,
          gstAmount: order.gstAmount,
          discountApplied: order.discountApplied,
          currency: order.currency,
          contextType: order.contextType,
        },
        isAdmin: true,
      });
      await inngest.send({
        name: "invoice/send",
        data: { orderId: order.id },
        id: `invoice-${order.id}`,
      });
      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* 🔁 SUBSCRIPTION ACTIVATED (FIRST PAYMENT SUCCESS) */
    /* ========================================================= */
    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.authenticated"
    ) {
      const subscription = event.payload.subscription.entity;
      const payment = event.payload.payment?.entity;
      const order = await prisma.paymentOrder.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
        include: {
          plan: true,
        },
      });

      if (!order) {
        console.error("Order not found for subscription", subscription.id);
        return NextResponse.json({ received: true });
      }

      if (!order.planId || !order.plan) {
        console.error("Subscription order missing plan relation");
        return NextResponse.json({ received: true });
      }
      // 🛑 IDEMPOTENCY CHECK
      if (order.status === PaymentStatus.PAID) {
        console.log("⚠️ Webhook already processed for this order. Skipping...");
        return NextResponse.json({ received: true });
      }
      const planId = order.planId;
      const plan = order.plan;
      const startDate = new Date();

      // ✅ END DATE BASED ON PLAN INTERVAL
      const endDate = new Date(startDate);

      if (order.plan.interval === "MONTHLY") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (order.plan.interval === "YEARLY") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      /* =======================================================
         🚀 NEW: UPGRADE / DOWNGRADE CANCELLATION LOGIC
         ======================================================= */
      const notes = subscription.notes || {};
      const action = notes.action;
      const cancelOldSubId = notes.cancelOldSubId;
      if (cancelOldSubId && (action === "UPGRADE" || action === "DOWNGRADE")) {
        console.log(
          `\n🔄 [UPGRADE/DOWNGRADE DETECTED] Action: ${action}, Cancelling Old Sub ID: ${cancelOldSubId}`,
        );

        try {
          const oldSubscription = await prisma.subscription.findUnique({
            where: { id: cancelOldSubId },
          });

          if (oldSubscription?.razorpaySubscriptionId) {
            const rzp = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID!,
              key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            if (action === "UPGRADE") {
              console.log(
                `🛑 [UPGRADE] Cancelling old Razorpay Sub ${oldSubscription.razorpaySubscriptionId} IMMEDIATELY`,
              );
              await rzp.subscriptions.cancel(
                oldSubscription.razorpaySubscriptionId,
                false,
              );
            } else if (action === "DOWNGRADE") {
              console.log(
                `⏳ [DOWNGRADE] Cancelling old Razorpay Sub ${oldSubscription.razorpaySubscriptionId} AT CYCLE END`,
              );
              await rzp.subscriptions.cancel(
                oldSubscription.razorpaySubscriptionId,
                true,
              );
            }

            // Update local DB status safely
            await prisma.subscription.update({
              where: { id: cancelOldSubId },
              data: {
                status:
                  action === "UPGRADE" ? "CANCELLED" : "CANCELLATION_PENDING",
              },
            });
            console.log(
              `✅ Successfully processed old subscription cancellation.\n`,
            );
          }
        } catch (error) {
          console.error(
            "❌ Failed to cancel old Razorpay subscription:",
            error,
          );
        }
      }
      await prisma.$transaction(async (tx) => {
        /* =======================================================
           1️⃣ MARK PAYMENT ORDER AS PAID (CRITICAL)
           ======================================================= */
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: PaymentStatus.PAID,
            paymentId: payment?.id, // Save the payment ID here
            paymentMethod: payment?.method,
            paidAt: new Date(),
          },
        });

        /* =======================================================
           2️⃣ CREATE / ACTIVATE SUBSCRIPTION
           ======================================================= */
        let activeSubscription = await tx.subscription.findFirst({
          where: { userId: order.userId },
        });

        if (!activeSubscription) {
          activeSubscription = await tx.subscription.create({
            data: {
              userId: order.userId,
              planId: planId,
              status: SubscriptionStatus.ACTIVE,
              razorpaySubscriptionId: subscription.id,
              // startDate: new Date(subscription.start_at * 1000),
              // endDate: new Date(subscription.current_end * 1000),
              startDate,
              endDate,
              paymentOrderId: order.id,
            },
          });
        } else {
          activeSubscription = await tx.subscription.update({
            where: { id: activeSubscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              razorpaySubscriptionId: subscription.id,
              paymentOrderId: order.id,
              startDate, // 🔥 ADD THIS
              endDate,
              planId: planId,
            },
          });
        }

        /* =======================================================
           3️⃣ CREATE / UPDATE MANDATE (IDEMPOTENT)
           ======================================================= */
        const mandate = await tx.mandate.upsert({
          where: {
            mandateId: subscription.id, // UNIQUE
          },
          update: {
            userId: order.userId,
            planId: planId,
            status: "ACTIVE",
            currency: order.currency,
            frequency: plan.interval,
            maxAmount: order.totalAmount,
            nextBillingDate: endDate,
          },
          create: {
            mandateId: subscription.id,
            userId: order.userId,
            planId: planId,
            status: "ACTIVE",
            currency: order.currency,
            frequency: plan.interval,
            maxAmount: order.totalAmount,
            nextBillingDate: endDate,
          },
        });

        // 🔗 Attach mandate to subscription (optional but recommended)
        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: { mandateId: mandate.id },
        });

        /* =======================================================
           4️⃣ COUPON REDEMPTION (FLAG-BASED, MINIMAL)
           ======================================================= */
        if (order.couponId) {
          const redemption = await tx.couponRedemption.findFirst({
            where: {
              couponId: order.couponId,
              userId: order.userId,
            },
          });

          if (!redemption) {
            await tx.couponRedemption.create({
              data: {
                couponId: order.couponId,
                userId: order.userId,
                appliedPlan: order.planId as string,
                discountApplied: order.discountApplied,
                redeemed: true,
              },
            });
          } else if (!redemption.redeemed) {
            await tx.couponRedemption.update({
              where: { id: redemption.id },
              data: { redeemed: true },
            });
          }
        }

        /* =======================================================
           5️⃣ UPDATE USER MEMBERSHIP
           ======================================================= */
        await tx.user.update({
          where: { id: order.userId },
          data: { membership: "PAID" },
        });
      });
      await createAffiliateEarningForSubscription({
        tx: prisma,
        order: {
          id: order.id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          baseAmount: order.baseAmount,
          gstAmount: order.gstAmount,
          discountApplied: order.discountApplied,
          currency: order.currency,
          contextType: order.contextType,
        },
        isAdmin: true,
      });
      await inngest.send({
        name: "invoice/send",
        data: { orderId: order.id },
        id: `invoice-${order.id}`,
      });
      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* 🔁 RECURRING SUBSCRIPTION PAYMENT SUCCESS */
    /* ========================================================= */
    if (event.event === "invoice.paid") {
      const invoice = event.payload.invoice.entity;

      const subscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: invoice.subscription_id },
      });

      if (!subscription) return NextResponse.json({ received: true });

      const periodEndTimestamp = invoice.period_end;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: subscription.userId },
          data: { membership: "PAID" },
        });

        if (periodEndTimestamp) {
          const validEndDate = new Date(periodEndTimestamp * 1000);

          // 🔥 MAGIC FIX: Only update if the new date is further in the future!
          if (validEndDate > subscription.endDate) {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: {
                renewedAt: new Date(),
                endDate: validEndDate,
              },
            });
            await tx.mandate.updateMany({
              where: { mandateId: subscription.razorpaySubscriptionId! },
              data: { nextBillingDate: validEndDate },
            });
          }
        }
      });
      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* ❌ SUBSCRIPTION CANCELLED */
    /* ========================================================= */
    if (event.event === "subscription.cancelled") {
      const subscription = event.payload.subscription.entity;

      await prisma.$transaction(async (tx) => {
        // 1. Update the Subscription status in your DB
        await tx.subscription.updateMany({
          where: { razorpaySubscriptionId: subscription.id },
          data: { status: SubscriptionStatus.CANCELLED },
        });

        // 2. Find the user associated with this subscription
        const dbSub = await tx.subscription.findFirst({
          where: { razorpaySubscriptionId: subscription.id },
          select: { userId: true },
        });

        if (dbSub) {
          // 3. Flip membership back to FREE
          // Note: If you want to allow access until the end of the month,
          // you could skip this step here and use a cron job to check 'endDate'.
          await tx.user.update({
            where: { id: dbSub.userId },
            data: { membership: "FREE" },
          });
        }
      });

      return NextResponse.json({ received: true });
    }
    /* ========================================================= */
    /* ❌ PAYMENT FAILED */
    /* ========================================================= */
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await prisma.paymentOrder.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: { status: PaymentStatus.FAILED },
      });

      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* 💸 BANK REVERSAL / REFUND */
    /* ========================================================= */
    if (
      event.event === "refund.processed" 
    ) {
      const refund = event.payload.refund.entity;

      await handlePaymentReversal(refund.payment_id);

      return NextResponse.json({ received: true,message:"Payment refund event fires" },{status:200});
    }

    console.log("⚠️ Unhandled event:", event.event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🔥 Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
};
