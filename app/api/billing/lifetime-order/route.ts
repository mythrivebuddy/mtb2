import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubscriptionStatus } from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";

/**
 * Calculate discount applied on base (exclusive of GST)
 * (Identical to your mandate logic)
 */
type CouponLike = {
  type: "PERCENTAGE" | "FIXED" | "FREE_DURATION" | "FULL_DISCOUNT" | "AUTO_APPLY";
  discountPercentage?: number | null;
  discountAmount?: number | null;
  freeDays?: number | null;
};

function calculateDiscount(baseAmount: number, coupon: CouponLike | null): number {
  if (!coupon) return 0;

  switch (coupon.type) {
    case "PERCENTAGE":
      return (baseAmount * (coupon.discountPercentage || 0)) / 100;

    case "FIXED":
      return coupon.discountAmount || 0;

    case "FREE_DURATION": // Treat free duration as 100% off for lifetime if applicable, or logic specific to you
    case "FULL_DISCOUNT":
      return baseAmount;

    default:
      return 0;
  }
}

/**
 * Calculates Final Payable Amount for Lifetime
 * No renewal logic needed here.
 */
function calculateLifetimeTotal(
  baseExclusive: number,
  discountValue: number,
  isIndia: boolean,
  gstEnabled: boolean,
  gstRate: number
) {
  // 1. Apply Discount first
  const discountedBase = Math.max(0, baseExclusive - discountValue);

  // 2. If free, return 0 (or handle as free order)
  if (discountedBase === 0) return 0;

  // 3. Apply GST if applicable
  let finalAmount = discountedBase;
  if (isIndia && gstEnabled) {
    finalAmount = discountedBase + (discountedBase * gstRate);
  }

  // 4. Return fixed 2 decimal number
  return parseFloat(finalAmount.toFixed(2));
}

export async function POST(req: Request) {
  try {
    const { planId, couponCode, billingDetails,mode } = await req.json();

    // ----------------------------
    // 1. AUTH & VALIDATION (Same as Mandate)
    // ----------------------------
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
      const { baseUrl, appId, secret } = await getCashfreeConfig();

    if (!billingDetails?.country)
      return NextResponse.json({ error: "Billing details missing" }, { status: 400 });

    const isIndia = billingDetails.country === "IN";

    // ----------------------------
    // 2. FETCH PLAN
    // ----------------------------
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const currency = isIndia ? "INR" : "USD";
    const baseExclusive = isIndia ? plan.amountINR : plan.amountUSD;

    if (!baseExclusive || baseExclusive < 1)
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });

    const gstEnabled = plan.gstEnabled;
    const gstRate = plan.gstPercentage / 100;

    // ----------------------------
    // 3. COUPON VALIDATION (Same as Mandate)
    // ----------------------------
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({
        where: { couponCode },
      });

      if (!appliedCoupon)
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });

      const now = new Date();

      if (
        appliedCoupon.startDate > now ||
        appliedCoupon.endDate < now ||
        appliedCoupon.status !== "ACTIVE"
      ) {
        return NextResponse.json({ error: "Coupon inactive or expired" }, { status: 400 });
      }

      const used = await prisma.couponRedemption.count({
        where: { couponId: appliedCoupon.id, userId },
      });

      if (appliedCoupon.maxUsesPerUser && used >= appliedCoupon.maxUsesPerUser) {
        return NextResponse.json({ error: "You already used this coupon" }, { status: 400 });
      }

      if (appliedCoupon.maxGlobalUses && appliedCoupon.maxGlobalUses <= 0) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }
    }

    // ----------------------------
    // 4. COMPUTE AMOUNT (Lifetime Logic)
    // ----------------------------
    const discountValue = calculateDiscount(baseExclusive, appliedCoupon);

    const payableAmount = calculateLifetimeTotal(
      baseExclusive,
      discountValue,
      isIndia,
      gstEnabled,
      gstRate
    );

    // If amount is 0 (100% coupon), handle strictly or ensure min amount for PG
    // Cashfree usually needs min 1.00 INR
    const finalOrderAmount = payableAmount <= 0 ? 1 : payableAmount; 

    // ----------------------------
    // 5. SAVE BILLING INFO (Same as Mandate)
    // ----------------------------
    await prisma.billingInformation.upsert({
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

    // ----------------------------
    // 6. RECORD COUPON USAGE
    // ----------------------------
    if (appliedCoupon) {
      await prisma.couponRedemption.create({
        data: {
          couponId: appliedCoupon.id,
          userId,
          appliedPlan: plan.name,
          discountApplied: discountValue,
        },
      });

      if (appliedCoupon.maxGlobalUses) {
        await prisma.coupon.update({
          where: { id: appliedCoupon.id },
          data: { maxGlobalUses: { decrement: 1 } },
        });
      }
    }

    // ----------------------------
    // 7. CASHFREE PAYLOAD (PG API, NOT Subscription API)
    // ----------------------------
    const orderId = `lifetime_${Date.now()}_${userId.slice(0,5)}`;

    const payload = {
      order_id: orderId,
      order_amount: finalOrderAmount,
      order_currency: currency,
      customer_details: {
        customer_id: userId,
        customer_name: billingDetails.name,
        customer_email: billingDetails.email,
        customer_phone: billingDetails.phone || "9999999999",
      },
      order_meta: {
        // This return URL is where Cashfree redirects after payment
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/payment-callback?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/cashfree`
      },
      order_note: `Lifetime Plan: ${plan.name}`
    };

    const resp = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01", // Use PG version
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Cashfree Order Error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create order" },
        { status: 500 }
      );
    }

    // ----------------------------
    // 8. SAVE SUBSCRIPTION (PENDING STATUS)
    // ----------------------------
    // Unlike mandate, we don't save a "Mandate" record.
    // We save a Subscription record that is inactive until paid.
    
    await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: SubscriptionStatus.PENDING, // Wait for Webhook to turn ACTIVE
        orderId: orderId,  // Key to match webhook
        // paymentId: data.payment_session_id,
        startDate: new Date(),
        // Set Lifetime Duration (e.g., 99 years)
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 99)),
      },
    });

    // Return Payment Session ID to Frontend
    return NextResponse.json({
      paymentSessionId: data.payment_session_id,
      orderId: orderId,
      mode
    });

  } catch (err) {
    console.error("Lifetime Order Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}