// /api/billing/razorpay/create-one-time-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { calculateDiscount } from "@/lib/payment/payment.utils";
import { PaymentContextType, PaymentStatus, Prisma } from "@prisma/client";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export const POST = async (req: NextRequest) => {
  try {
    // --------------------------------------------------
    // 1️⃣ AUTH
    // --------------------------------------------------
    const session = await checkRole("USER");
    const userId = session.user.id;

    const { planId, couponCode, billingDetails, action } = await req.json();

    if (!billingDetails?.country) {
      return NextResponse.json(
        { error: "Billing details missing" },
        { status: 400 },
      );
    }

    const isIndia = billingDetails.country === "IN";

    // --------------------------------------------------
    // 2️⃣ FETCH PLAN
    // --------------------------------------------------
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.interval !== "LIFETIME") {
      return NextResponse.json(
        { error: "Invalid lifetime plan" },
        { status: 400 },
      );
    }
    const currency = isIndia ? "INR" : "USD";
    const baseAmount = isIndia ? plan.amountINR : plan.amountUSD;
    const gstRate = plan.gstPercentage / 100;

    if (!baseAmount || baseAmount < 1) {
      return NextResponse.json(
        { error: "Invalid plan amount" },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 3️⃣ COUPON (READ-ONLY VALIDATION)
    // --------------------------------------------------
    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { couponCode },
      });

      if (!coupon) {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
      }

      const now = new Date();

      if (
        coupon.status !== "ACTIVE" ||
        coupon.startDate > now ||
        coupon.endDate < now
      ) {
        return NextResponse.json(
          { error: "Coupon expired or inactive" },
          { status: 400 },
        );
      }

      const used = await prisma.couponRedemption.count({
        where: { couponId: coupon.id, userId },
      });

      if (coupon.maxUsesPerUser && used >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: "Coupon already used" },
          { status: 400 },
        );
      }
    }
    const discountValue = calculateDiscount(baseAmount, coupon, currency);
    // Step 1: apply coupon
    const discountedBase = Math.max(0, baseAmount - discountValue);

    let proratedDiscount = 0;

    if (action === "UPGRADE") {
      const currentSub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
        orderBy: {
          endDate: "desc",
        },
      });

      if (currentSub) {

        const now = new Date().getTime();
        const start = new Date(currentSub.startDate).getTime();
        const end = new Date(currentSub.endDate).getTime();

        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
        const remainingDays = Math.max(0, (end - now) / (1000 * 60 * 60 * 24));

        const oldPrice = isIndia
          ? (currentSub.plan.amountINR ?? 0)
          : (currentSub.plan.amountUSD ?? 0);

        if (remainingDays > 0 && totalDays > 0) {
          proratedDiscount = (remainingDays / totalDays) * oldPrice;
        }
        proratedDiscount = Math.min(proratedDiscount, discountedBase);
      }
    }

    // --------------------------------------------------
    // 4️⃣ PRICE CALCULATION
    // --------------------------------------------------

    // Step 2: apply prorated credit
    const taxableAmount = Math.max(0, discountedBase - proratedDiscount);

    // Step 3: GST
    const gstAmount =
      isIndia && plan.gstEnabled
        ? Number((taxableAmount * gstRate).toFixed(2))
        : 0;

    // Step 4: final payable
    const finalAmount = Number((taxableAmount + gstAmount).toFixed(2));

    // Razorpay minimum safeguard
    const payableAmount = finalAmount <= 0 ? 1 : finalAmount;

    // --------------------------------------------------
    // 5️⃣ SAVE BILLING INFO
    // --------------------------------------------------
    const billingInfo = await prisma.userBillingInformation.upsert({
      where: { userId },
      update: {
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber || null,
      },
      create: {
        userId,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber || null,
      },
    });

    // --------------------------------------------------
    // 6️⃣ INTERNAL PAYMENT ORDER
    // --------------------------------------------------
    const existingOrder = await prisma.paymentOrder.findFirst({
      where: {
        userId,
        planId: plan.id,
      },
      orderBy: {
        createdAt: "desc", // optional but recommended
      },
    });
    let paymentOrder: Prisma.PaymentOrderGetPayload<Prisma.PaymentOrderDefaultArgs>;
    if (existingOrder) {
      paymentOrder = await prisma.paymentOrder.update({
        where: { id: existingOrder.id }, // must use unique field here
        data: {
          currency,
          couponId: coupon?.id,
          status: PaymentStatus.CREATED,
          baseAmount,
          discountApplied: discountValue + proratedDiscount,
          gstAmount:
            isIndia && plan.gstEnabled
              ? Number((taxableAmount * gstRate).toFixed(2))
              : 0,
          totalAmount: finalAmount,
          billingInfoId: billingInfo.id,
        },
      });
    } else {
      paymentOrder = await prisma.paymentOrder.create({
        data: {
          userId,
          planId: plan.id,
          currency,
          couponId: coupon?.id,
          status: PaymentStatus.CREATED,
          baseAmount,
          discountApplied: discountValue + proratedDiscount,
          gstAmount:
            isIndia && plan.gstEnabled
              ? Number((taxableAmount * gstRate).toFixed(2))
              : 0,
          totalAmount: finalAmount,
          billingInfoId: billingInfo.id,
          contextType: PaymentContextType.SUBSCRIPTION,
        },
      });
    }
    // const paymentOrder = await prisma.paymentOrder.create({
    //   data: {
    //     planId: plan.id,
    //     userId,
    //     currency,
    //     couponId: coupon?.id,
    //     status: PaymentStatus.CREATED,
    //     baseAmount,
    //     discountApplied: discountValue,
    //     totalAmount: payableAmount,
    //     billingInfoId: billingInfo.id,
    //   },
    // });

    //     // --------------------------------------------------
    //     // 7️⃣ PENDING SUBSCRIPTION (IMPORTANT)
    //     // --------------------------------------------------
    const internalOrderId = `lifetime_${paymentOrder.id}_${Date.now()}`;
    const razorpayReceipt = `lt_${Date.now().toString().slice(-8)}`;

    //     const existingSubscription = await prisma.subscription.findFirst({
    //   where: { userId },
    // });

    // if (existingSubscription) {
    //   await prisma.subscription.update({
    //     where: { id: existingSubscription.id },
    //     data: {
    //       planId: plan.id, // ✅ CRITICAL: Update the planId to the Lifetime ID
    //       status: SubscriptionStatus.PENDING,
    //       orderId: internalOrderId,
    //       paymentOrderId: paymentOrder.id,
    //       startDate: new Date(),
    //       endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 99)),
    //       // If you have a recurring subscription ID from Razorpay, clear it
    //       razorpaySubscriptionId: null,
    //     },
    //   });
    // } else {
    //       await prisma.subscription.create({
    //         data: {
    //           userId,
    //           planId: plan.id,
    //           status: SubscriptionStatus.PENDING,
    //           orderId: internalOrderId,
    //           paymentOrderId: paymentOrder.id,
    //           startDate: new Date(),
    //           endDate: new Date(
    //             new Date().setFullYear(new Date().getFullYear() + 99)
    //           ),
    //         },
    //       });
    //     }

    // --------------------------------------------------
    // 8️⃣ CREATE RAZORPAY ORDER
    // --------------------------------------------------
    const { razorpayKeyId, razorpayKeySecret } = await getRazorpayConfig();
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100), // paise
      currency,
      receipt: razorpayReceipt,
      notes: {
        paymentOrderId: paymentOrder.id,
        userId,
      },
    });

    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        orderId: internalOrderId,
        razorpayReceipt,
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING,
      },
    });

    // --------------------------------------------------
    // 9️⃣ RETURN (FIXED CONTRACT)
    // --------------------------------------------------
    return NextResponse.json({
      key: razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      purchaseId: paymentOrder.id,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
