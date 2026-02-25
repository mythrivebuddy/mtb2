// /api/billing/razorpay/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  Subscription,
  SubscriptionStatus,
} from "@prisma/client";
import { verifyRazorpaySignature } from "@/lib/razorpay/razorpay";

export const POST = async (req: NextRequest) => {
  console.log("WEBHOOK CALLED");
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Missing RAZORPAY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // ✅ RAW BODY REQUIRED
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error("❌ Invalid Razorpay signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    console.log("🔔 Razorpay Event:", event.event);

    /* ========================================================= */
    /* 🔵 ONE-TIME PAYMENT SUCCESS (LIFETIME UPGRADE FIX)        */
    /* ========================================================= */
    if (event.event === "payment.captured") {

      const payment = event.payload.payment.entity;

      // ✅ Ignore subscription payments
      if (payment.subscription_id) {
        return NextResponse.json({ received: true });
      }

      if (!payment.order_id)
        return NextResponse.json({ received: true });

      // 🔎 Use Razorpay order_id to find our paymentOrder
      const order = await prisma.paymentOrder.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });
       

      if (!order || order.status === PaymentStatus.PAID) return NextResponse.json({ received: true });

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

        // 2️⃣ Create or Update Subscription (LIFETIME)
        const existingSub = await tx.subscription.findFirst({
          where: { userId: order.userId },
        });

        const lifetimeEndDate = new Date(
          new Date().setFullYear(new Date().getFullYear() + 99)
        );

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: order.planId,
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
              planId: order.planId,
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

      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* 🔁 SUBSCRIPTION ACTIVATED (FIRST PAYMENT SUCCESS) */
    /* ========================================================= */
    if (event.event === "subscription.activated") {
      const subscription = event.payload.subscription.entity;
      const order = await prisma.paymentOrder.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
        include:{
          plan: true
        }
      });

      if (!order) return NextResponse.json({ received: true });

      await prisma.$transaction(async (tx) => {

        // 1️⃣ Mark payment order paid
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });
        // console.log("")
        // 2️⃣ Create or update subscription
        const existingSub = await tx.subscription.findFirst({
          where: { userId: order.userId },
        });
        let newSubscription: Subscription;

        if (existingSub) {
          newSubscription = await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: order.planId,
              status: SubscriptionStatus.ACTIVE,
              razorpaySubscriptionId: subscription.id,
              startDate: new Date(subscription.start_at * 1000),
              endDate: new Date(subscription.current_end * 1000),
              paymentOrderId: order.id,
            },
          });
        } else {
          newSubscription = await tx.subscription.create({
            data: {
              userId: order.userId,
              planId: order.planId,
              status: SubscriptionStatus.ACTIVE,
              razorpaySubscriptionId: subscription.id,
              startDate: new Date(subscription.start_at * 1000),
              endDate: new Date(subscription.current_end * 1000),
              paymentOrderId: order.id,
            },
          });

        }
        // const newSubscription = await tx.subscription.upsert({
        //     where: { userId: order.userId },
        //     update: {
        //       planId: order.planId,
        //       status: SubscriptionStatus.ACTIVE,
        //       razorpaySubscriptionId: subscription.id,
        //       startDate: new Date(subscription.start_at * 1000),
        //       endDate: new Date(subscription.current_end * 1000),
        //     },
        //     create: {
        //       userId: order.userId,
        //       planId: order.planId,
        //       status: SubscriptionStatus.ACTIVE,
        //       razorpaySubscriptionId: subscription.id,
        //       startDate: new Date(subscription.start_at * 1000),
        //       endDate: new Date(subscription.current_end * 1000),
        //     },
        //   });

        // 🟢 Mandate Creation
        const mandate = await tx.mandate.upsert({
          where: {
            mandateId: subscription.id, // ✅ unique field
          },
          update: {
            userId: order.userId,
            planId: order.planId,
            status: "ACTIVE",
            currency: order.currency,
            frequency: order.plan.interval,
            maxAmount: order.totalAmount,
            nextBillingDate: new Date(subscription.current_end * 1000),
          },
          create: {
            mandateId: subscription.id,
            userId: order.userId,
            planId: order.planId,
            status: "ACTIVE",
            currency: order.currency,
            frequency: order.plan.interval,
            maxAmount: order.totalAmount,
            nextBillingDate: new Date(subscription.current_end * 1000),
          },
        });
        // 🟢 Update subscription with mandateId
        await tx.subscription.update({
          where: { id: existingSub?.id || newSubscription.id },
          data: { mandateId: mandate.id },
        });

        // 3️⃣ Update membership
        await tx.user.update({
          where: { id: order.userId },
          data: { membership: "PAID" },
        });

      });

      return NextResponse.json({ received: true });
    }

    /* ========================================================= */
    /* 🔁 RECURRING SUBSCRIPTION PAYMENT SUCCESS */
    /* ========================================================= */
    if (event.event === "invoice.paid") {
      const invoice = event.payload.invoice.entity;

      // 🔍 Log this to see exactly what Razorpay is sending
      console.log("Invoice Period End:", invoice.period_end);

      const subscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: invoice.subscription_id },
      });

      if (!subscription) return NextResponse.json({ received: true });

      // ✅ Fix: Ensure the date is a valid number
      const periodEndTimestamp = invoice.period_end || (Math.floor(Date.now() / 1000) + 2592000); // Fallback +30 days
      const validEndDate = new Date(periodEndTimestamp * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: subscription.userId },
          data: { membership: "PAID" },
        });

        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            renewedAt: new Date(),
            endDate: validEndDate, // ✅ Now guaranteed to be a valid Date object
          },
        });
        // Update mandate's nextBillingDate
        await tx.mandate.updateMany({
          where: { mandateId: subscription.razorpaySubscriptionId! },
          data: { nextBillingDate: validEndDate },
        });

        // ... rest of your code for creating the invoice
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
          select: { userId: true }
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


    console.log("⚠️ Unhandled event:", event.event);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("🔥 Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
};
