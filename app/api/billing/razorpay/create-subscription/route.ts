import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { calculateDiscount, calculateFinal } from "@/lib/payment/payment.utils";
import { PaymentStatus } from "@prisma/client";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

const { keyId, keySecret } = await getRazorpayConfig();

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export const POST = async (req: NextRequest) => {
  try {
    const { planId, couponCode, billingDetails } = await req.json();
    const session = await checkRole("USER");
    const userId = session.user.id;

    if (!billingDetails?.country) {
      return NextResponse.json({ error: "Billing details missing" }, { status: 400 });
    }

    const isIndia = billingDetails.country === "IN";

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 🔐 Subscription only for MONTHLY / YEARLY
    if (!["MONTHLY", "YEARLY"].includes(plan.interval)) {
      return NextResponse.json(
        { error: "Plan is not eligible for subscription" },
        { status: 400 }
      );
    }

    const currency = isIndia ? "INR" : "USD";
    const baseAmount = isIndia ? plan.amountINR : plan.amountUSD;
    const gstRate = plan.gstPercentage / 100;

    // 1️⃣ Coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { couponCode } });
      if (!coupon) {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
      }
    }

    const discountValue = calculateDiscount(baseAmount, coupon);

    // 2️⃣ Final recurring amount
    const finalAmount = calculateFinal(
      baseAmount,
      discountValue,
      isIndia,
      plan.gstEnabled,
      gstRate
    );

    if (finalAmount <= 0) {
      return NextResponse.json({ error: "Invalid payable amount" }, { status: 400 });
    }

    // 3️⃣ Billing info (same as Cashfree)
    const billingInfo = await prisma.billingInformation.upsert({
      where: { userId },
      update: {
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
      },
      create: {
        userId,
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
      },
    });

    // 4️⃣ Create local payment order (CREATED)
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        planId: plan.id,
        userId,
        currency,
        couponId: coupon?.id,
        status: PaymentStatus.CREATED,
        baseAmount,
        gstAmount:
          isIndia && plan.gstEnabled
            ? parseFloat(((baseAmount - discountValue) * gstRate).toFixed(2))
            : 0,
        discountApplied: discountValue,
        totalAmount: finalAmount,
        billingInfoId: billingInfo.id,
      },
    });

    const internalOrderId = `sub_${paymentOrder.id}_${Date.now()}`;

    /**
     * 5️⃣ Create Razorpay Subscription
     * Amount is in paise
     */
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId!, // must already exist in Razorpay
      customer_notify: 1,
      total_count: plan.interval === "YEARLY" ? 1 : 12,
      notes: {
        paymentOrderId: paymentOrder.id,
        userId,
        internalOrderId,
      },
    });

    // 6️⃣ Update DB with Razorpay IDs
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        orderId: internalOrderId,
        razorpaySubscriptionId: subscription.id,
        status: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({
      key: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      purchaseId: paymentOrder.id,
      internalOrderId,
    });

  } catch (error) {
    console.error("Razorpay subscription error:", error);
    return NextResponse.json(
      { error: "Unable to create subscription" },
      { status: 500 }
    );
  }
};
