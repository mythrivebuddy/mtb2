import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const { keySecret } = await getRazorpayConfig();

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 1️⃣ Fetch payment order
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { orderId: razorpay_order_id },
      include: { plan: true },
    });

    if (!paymentOrder) {
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    }

    // 2️⃣ Mark payment as PAID
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: "PAID",
        paymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // 3️⃣ Subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (paymentOrder.plan.interval === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (paymentOrder.plan.interval === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 100); // lifetime
    }

    // 4️⃣ Create Subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: paymentOrder.userId,
        planId: paymentOrder.planId,
        paymentOrderId: paymentOrder.id,
        orderId: razorpay_order_id,
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    // 5️⃣ Create Invoice
    await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: subscription.id,
        userId: paymentOrder.userId,
        planId: paymentOrder.planId,
        baseAmount: paymentOrder.baseAmount,
        gstAmount: paymentOrder.gstAmount,
        totalAmount: paymentOrder.totalAmount,
        currency: paymentOrder.currency,
        transactionId: razorpay_payment_id,
        status: "PAID",
        billingDate: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
