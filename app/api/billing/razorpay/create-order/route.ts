import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
import { checkRole } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;
    const { planId, couponCode } = await req.json();

    // 1️⃣ Fetch plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userType !== "COACH" && plan.userType !== "ALL") {
      return NextResponse.json(
        { error: "Invalid plan for coach" },
        { status: 400 }
      );
    }

    // 🔹 FREE PLAN SHORT-CIRCUIT (FIXED)
    if (plan.interval === "FREE" || plan.amountINR === 0) {
      return NextResponse.json({ success: true });
    }

    // 2️⃣ Base amount
    let baseAmount = plan.amountINR;
    let discountApplied = 0;
    let couponId: string | null = null;

    // 3️⃣ Apply coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { couponCode, status: "ACTIVE" },
      });

      if (coupon?.discountPercentage) {
        discountApplied = (baseAmount * coupon.discountPercentage) / 100;
        couponId = coupon.id;
      }
    }

    baseAmount -= discountApplied;

    // 🔹 SAFETY: 100% DISCOUNT = FREE FLOW
    if (baseAmount <= 0) {
      const paymentOrder = await prisma.paymentOrder.create({
        data: {
          userId,
          planId: plan.id,
          baseAmount: 0,
          gstAmount: 0,
          discountApplied,
          totalAmount: 0,
          currency: "INR",
          status: "PAID",
          paidAt: new Date(),
          couponId,
        },
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          paymentOrderId: paymentOrder.id,
          couponId,
          status: "ACTIVE",
          startDate,
          endDate,
        },
      });

      return NextResponse.json({ isFreePlan: true });
    }

    // 4️⃣ GST calculation
    const gstAmount = plan.gstEnabled
      ? (baseAmount * plan.gstPercentage) / 100
      : 0;

    const totalAmount = baseAmount + gstAmount;

    // 5️⃣ Create PaymentOrder
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        planId: plan.id,
        baseAmount,
        gstAmount,
        discountApplied,
        totalAmount,
        currency: "INR",
        status: "CREATED",
        couponId,
      },
    });

    // 6️⃣ Razorpay
    const { razorpayKeyId, razorpayKeySecret } = await getRazorpayConfig();

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: paymentOrder.id,
      notes: {
        planId: plan.id,
        userId,
        paymentOrderId: paymentOrder.id,
      },
    });

    // 7️⃣ Update PaymentOrder
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: { orderId: razorpayOrder.id },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
