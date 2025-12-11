import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";

/**
 * Calculate discount applied on base (exclusive of GST)
 * 
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

    case "FREE_DURATION":
    case "FULL_DISCOUNT":
      return baseAmount;

    default:
      return 0;
  }
}

/**
 * Calculates:
 * - firstChargeAmount → discounted base + GST on discounted base
 * - renewalAmount → full base + GST on full base
 */
function calculateAmounts(
  baseExclusive: number,
  discountValue: number,
  isIndia: boolean,
  gstEnabled: boolean,
  gstRate: number
) {
  const applyGST = isIndia && gstEnabled;

  // ---------------------
  // Renewal (ALWAYS full price)
  // ---------------------
  let renewalAmount = baseExclusive;
  if (applyGST) {
    renewalAmount = baseExclusive + baseExclusive * gstRate;
  }
  renewalAmount = Number(renewalAmount.toFixed(2));

  // ---------------------
  // First Charge (discounted)
  // ---------------------
  const discountedBase = Math.max(0, baseExclusive - discountValue);

  let firstChargeAmount = discountedBase;

  if (discountedBase === 0) {
    // Cashfree minimum mandate amount
    firstChargeAmount = 1;
  } else {
    if (applyGST) {
      firstChargeAmount = discountedBase + discountedBase * gstRate;
    }
  }

  firstChargeAmount = Number(firstChargeAmount.toFixed(2));

  return { firstChargeAmount, renewalAmount };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log("RAW REQUEST BODY:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error("REQUEST JSON PARSE ERROR:", err);
      return NextResponse.json(
        { error: "Invalid JSON sent from frontend", raw: rawBody },
        { status: 400 }
      );
    }

    const { planId, couponCode, billingDetails } = body;


    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { baseUrl, appId, secret } = await getCashfreeConfig();


    const userId = session.user.id;

    if (!billingDetails?.country)
      return NextResponse.json({ error: "Billing details missing" }, { status: 400 });

    const isIndia = billingDetails.country === "IN";

    // ----------------------------
    // Fetch plan
    // ----------------------------
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const currency = isIndia ? "INR" : "USD";
    const baseExclusive = isIndia ? plan.amountINR : plan.amountUSD;

    if (!baseExclusive || baseExclusive < 1)
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });

    // GST settings from DB
    const gstEnabled = plan.gstEnabled;
    const gstRate = plan.gstPercentage / 100;

    // ----------------------------
    // COUPON VALIDATION
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
        return NextResponse.json(
          { error: "Coupon inactive or expired" },
          { status: 400 }
        );
      }

      const used = await prisma.couponRedemption.count({
        where: { couponId: appliedCoupon.id, userId },
      });

      if (
        appliedCoupon.maxUsesPerUser &&
        used >= appliedCoupon.maxUsesPerUser
      ) {
        return NextResponse.json(
          { error: "You already used this coupon" },
          { status: 400 }
        );
      }

      if (appliedCoupon.maxGlobalUses && appliedCoupon.maxGlobalUses <= 0) {
        return NextResponse.json(
          { error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }
    }

    // ----------------------------
    // Compute charges
    // ----------------------------
    const discountValue = calculateDiscount(baseExclusive, appliedCoupon);

    const { firstChargeAmount, renewalAmount } = calculateAmounts(
      baseExclusive,
      discountValue,
      isIndia,
      gstEnabled,
      gstRate
    );

    // ----------------------------
    // Save Billing Information
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
    // Record coupon redemption
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
          data: {
            maxGlobalUses: { decrement: 1 },
          },
        });
      }
    }

    // ----------------------------
    // CASHFREE PAYLOAD
    // ----------------------------
    const subscriptionId = `sub_${Date.now()}_${userId}`;

    const payload = {
      subscription_id: subscriptionId,
      customer_details: {
        customer_name: billingDetails.name,
        customer_email: billingDetails.email,
        customer_phone: billingDetails.phone || "9999999999",
      },
      plan_details: {
        plan_name: plan.name,
        plan_type: "PERIODIC",

        // RENEWAL PRICE (full GST applied)
        plan_amount: renewalAmount,

        // Must be >= authorization amount
        plan_max_amount: Math.max(renewalAmount, firstChargeAmount),

        plan_max_cycles: 500,
        plan_intervals: 1,
        plan_currency: currency,
        plan_interval_type: plan.interval === "MONTHLY" ? "MONTH" : "YEAR",
        plan_note: "Subscription",
      },
      authorization_details: {
        authorization_amount: firstChargeAmount, // FIRST cycle ONLY
        authorization_amount_refund: false,
        payment_methods: ["upi", "card", "enach"],
      },
      subscription_meta: {
        return_url:
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/subscription-callback?sub_id=${subscriptionId}`,
        notification_channel: ["EMAIL"],
        session_id_expiry: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .replace("Z", "+05:30"),
      },
      subscription_expiry_time: "2100-01-01T23:00:08+05:30",
    };

    const resp = await fetch(`${baseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2025-01-01",
      },
      body: JSON.stringify(payload),
    });

    // Debug: read raw response
    const raw = await resp.text();
    console.log("RAW CASHFREE RESPONSE:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("JSON PARSE ERROR. RAW RESPONSE WAS NOT JSON.");
      console.error("RAW RESPONSE:", raw);
      console.log("ERROR OBJ: of cahsfree api ", err);

      return NextResponse.json(
        {
          error: "Cashfree returned invalid JSON",
          raw,
        },
        { status: 500 }
      );
    }

    if (!resp.ok) {
      console.error("Cashfree error:", data);
      return NextResponse.json(
        { error: "Failed to create subscription", details: data },
        { status: 500 }
      );
    }
    // ----------------------------
    // Save Mandate
    // ----------------------------
    await prisma.mandate.create({
      data: {
        mandateId: subscriptionId,
        userId,
        planId,
        status: "PENDING",
        currency,
        frequency: plan.interval,
        maxAmount: renewalAmount,
      },
    });

    return NextResponse.json({
      subscriptionId: data.subscription_id,
      subscriptionSessionId: data.subscription_session_id,
    });
  } catch (err) {
    console.error("Mandate error:", err);

    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
