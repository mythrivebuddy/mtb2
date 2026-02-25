import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { calculateDiscount, calculateFinal } from "@/lib/payment/payment.utils";
import {
  PaymentStatus,
} from "@prisma/client";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export const POST = async (req: NextRequest) => {
  try {
    /* -------------------------------------------------- */
    /* 1️⃣ AUTH */
    /* -------------------------------------------------- */
    const session = await checkRole("USER");
    const userId = session.user.id;

    const { planId, couponCode, billingDetails } = await req.json();

    if (!billingDetails?.country) {
      return NextResponse.json(
        { error: "Billing details missing" },
        { status: 400 }
      );
    }

    /* -------------------------------------------------- */
    /* 2️⃣ PLAN VALIDATION */
    /* -------------------------------------------------- */
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!["MONTHLY", "YEARLY"].includes(plan.interval)) {
      return NextResponse.json(
        { error: "Plan is not subscription based" },
        { status: 400 }
      );
    }

    // if (!plan.razorpayPlanId) {
    //   return NextResponse.json(
    //     { error: "Razorpay plan not configured" },
    //     { status: 500 }
    //   );
    // }

    const isIndia = billingDetails.country === "IN";
    const currency = isIndia ? "INR" : "USD";
    console.log(currency)
    const baseAmount = isIndia ? plan.amountINR : plan.amountUSD;
    const gstRate = plan.gstPercentage / 100;

    /* -------------------------------------------------- */
    /* 3️⃣ COUPON VALIDATION */
    /* -------------------------------------------------- */
    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { couponCode },
      });

      if (!coupon)
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });

      const now = new Date();

      if (
        coupon.startDate > now ||
        coupon.endDate < now ||
        coupon.status !== "ACTIVE"
      ) {
        return NextResponse.json(
          { error: "Coupon inactive or expired" },
          { status: 400 }
        );
      }

      const used = await prisma.couponRedemption.count({
        where: { couponId: coupon.id, userId },
      });

      if (
        coupon.maxUsesPerUser &&
        used >= coupon.maxUsesPerUser
      ) {
        return NextResponse.json(
          { error: "You already used this coupon" },
          { status: 400 }
        );
      }

      if (coupon.maxGlobalUses && coupon.maxGlobalUses <= 0) {
        return NextResponse.json(
          { error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }
    }

    // ----------------------------
    // Compute charges
    // ----------------------------
    const discountValue = calculateDiscount(baseAmount, coupon);

    let finalAmount = calculateFinal(
      baseAmount,
      discountValue,
      isIndia,
      plan.gstEnabled,
      gstRate
    );

    finalAmount = (finalAmount <= 0) ? 1 : finalAmount;

    /* -------------------------------------------------- */
    /* 4️⃣ BILLING INFO */
    /* -------------------------------------------------- */
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

    /* -------------------------------------------------- */
    /* 5️⃣ INTERNAL PAYMENT ORDER */
    /* -------------------------------------------------- */
    const existingOrder = await prisma.paymentOrder.findFirst({
  where: {
    userId,
    planId: plan.id,
  },
  orderBy: {
    createdAt: "desc", // optional but recommended
  },
});
let paymentOrder;
if (existingOrder) {
  paymentOrder = await prisma.paymentOrder.update({
    where: { id: existingOrder.id }, // must use unique field here
    data: {
      currency,
      couponId: coupon?.id,
      status: PaymentStatus.CREATED,
      baseAmount,
      discountApplied: discountValue,
      gstAmount:
        isIndia && plan.gstEnabled
          ? Number(((baseAmount - discountValue) * gstRate).toFixed(2))
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
      discountApplied: discountValue,
      gstAmount:
        isIndia && plan.gstEnabled
          ? Number(((baseAmount - discountValue) * gstRate).toFixed(2))
          : 0,
      totalAmount: finalAmount,
      billingInfoId: billingInfo.id,
    },
  });
}
    // const paymentOrder = await prisma.paymentOrder.create({
    //   data: {
    //     userId,
    //     planId: plan.id,
    //     currency,
    //     couponId: coupon?.id,
    //     status: PaymentStatus.CREATED,
    //     baseAmount,
    //     discountApplied: discountValue,
    //     gstAmount:
    //       isIndia && plan.gstEnabled
    //         ? Number(((baseAmount - discountValue) * gstRate).toFixed(2))
    //         : 0,
    //     totalAmount: finalAmount,
    //     billingInfoId: billingInfo.id,
    //   },
    // });

    const internalOrderId = `sub_${paymentOrder.id}`;

    // ----------------------------
    // Record coupon redemption
    // ----------------------------
    if (coupon) {
      await prisma.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId,
          appliedPlan: plan.name,
          discountApplied: discountValue,
        },
      });

      if (coupon.maxGlobalUses) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: {
            maxGlobalUses: { decrement: 1 },
          },
        });
      }
    }

/* -------------------------------------------------- */
/* 6️⃣ RAZORPAY SUBSCRIPTION */
/* -------------------------------------------------- */
const { keyId, keySecret } = await getRazorpayConfig();

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log("finalAmount", finalAmount, "currency", currency, "plan.interval", plan.interval)
// Find if a plan with these exact specs already exists
const existingPlan = await prisma.razorpayPlanCache.findFirst({
  where: {
    amount: finalAmount,
    currency,
    interval: plan.interval,
    planName: plan.name,
  },
});
console.log(existingPlan)
let subscriptionPlanId: string;
console.log("CHECKING CONDITION");
if (!existingPlan) {
  console.log("Entered if block", currency);
  const razorpayPlan = await razorpay.plans.create({
    period: plan.interval === "MONTHLY" ? "monthly" : "yearly",
    interval: 1,
    item: {
      name: plan.name,
      amount: Math.round(finalAmount * 100), // convert to subunits/paise
      currency,
      description: plan.name,
    },
  });
  console.log(razorpayPlan)

  // Cache it so we don't create thousands of duplicate plans in Razorpay
  const cached = await prisma.razorpayPlanCache.create({
    data: {
      razorpayPlanId: razorpayPlan.id,
      amount: finalAmount,
      currency,
      interval: plan.interval,
      planName: plan.name,
      gstEnabled: plan.gstEnabled,
    gstPercentage: plan.gstPercentage,
    },
  });
  
  subscriptionPlanId = cached.razorpayPlanId;
} else {
  subscriptionPlanId = existingPlan.razorpayPlanId;
}

// Create the actual subscription
const razorpaySubscription = await razorpay.subscriptions.create({
  plan_id: subscriptionPlanId,
  customer_notify: 1,
  total_count: plan.interval === "MONTHLY" ? 120 : 10, // max 10 years
  notes: {
    paymentOrderId: paymentOrder.id,
    userId,
    internalOrderId,
  },
});

//    /* -------------------------------------------------- */
// /* 7️⃣ MANDATE + SUBSCRIPTION (LOCAL) */
// /* -------------------------------------------------- */

// // 1. Create or Update Mandate
// const mandate = await prisma.mandate.create({
//   data: {
//     mandateId: razorpaySubscription.id,
//     userId,
//     planId: plan.id,
//     status: MandateStatus.PENDING,
//     currency,
//     frequency: plan.interval,
//     maxAmount: finalAmount,
//   },
// });

// // 2. Find if user already has a subscription entry
// const existingSubscription = await prisma.subscription.findFirst({
//   where: { userId: userId },
// });

// const subscriptionData = {
//   planId: plan.id,
//   couponId: coupon?.id || null,
//   status: SubscriptionStatus.PENDING,
//   mandateId: mandate.id,
//   paymentOrderId: paymentOrder.id,
//   razorpaySubscriptionId: razorpaySubscription.id,
// };

// if (existingSubscription) {
//   // 3. Update using the unique Primary Key (id)
//   await prisma.subscription.update({
//     where: { id: existingSubscription.id },
//     data: subscriptionData,
//   });
// } else {
//   // 4. Create new if none exists
//   await prisma.subscription.create({
//     data: {
//       ...subscriptionData,
//       userId,
//       startDate: new Date(),
//       endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
//     },
//   });
// }

    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        orderId: internalOrderId,
        razorpaySubscriptionId: razorpaySubscription.id,
        status: PaymentStatus.PENDING,
      },
    });


    /* -------------------------------------------------- */
    /* 8️⃣ RESPONSE */
    /* -------------------------------------------------- */
    return NextResponse.json({
      key: keyId,
      subscriptionId: razorpaySubscription.id,
      purchaseId: paymentOrder.id,
      internalOrderId,
    });
  } catch (error) {
    console.error("Razorpay subscription create error:", error);
    return NextResponse.json(
      { error: "Unable to create subscription" },
      { status: 500 }
    );
  }
};
