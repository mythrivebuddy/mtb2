import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, planId, currency, challengeId, userId } = await req.json();

    if (!code || (!planId && !challengeId)) {
      return NextResponse.json(
        { valid: false, message: "Missing code or details." },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Fetch coupon
    const coupon = await prisma.coupon.findUnique({
      where: { couponCode: code.toUpperCase() },
      include: {
        applicablePlans: { select: { id: true } },
        applicableChallenges: { select: { id: true } },
        _count: { select: { redemptions: true } },
      },
    });

    // 2. Basic checks
    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid coupon code." }, { status: 404 });
    }

   
    if (coupon.scope === "CHALLENGE" && !challengeId) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is only valid for challenges",
      });
    }

    if (coupon.scope === "SUBSCRIPTION" && !planId) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is only valid for subscriptions",
      });
    }
    const userUses = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (coupon.maxUsesPerUser && userUses >= coupon.maxUsesPerUser) {
      return NextResponse.json({
        valid: false,
        message: "You have already used this coupon."
      }, { status: 400 });
    }


    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { valid: false, message: "This coupon is inactive or expired." },
        { status: 400 }
      );
    }

    if (now < coupon.startDate || now > coupon.endDate) {
      return NextResponse.json(
        { valid: false, message: "Coupon is not valid at this time." },
        { status: 400 }
      );
    }

    // 3. Usage limits
    if (coupon.maxGlobalUses && (coupon._count?.redemptions || 0) >= coupon.maxGlobalUses) {
      return NextResponse.json(
        { valid: false, message: "Coupon usage limit reached." },
        { status: 400 }
      );
    }

    // 4. Plan applicability
    // Plan applicability
    if (planId && coupon.applicablePlans.length > 0) {
      const isPlanValid = coupon.applicablePlans.some((p) => p.id === planId);
      if (!isPlanValid) {
        return NextResponse.json(
          { valid: false, message: "Coupon not applicable for this plan." },
          { status: 400 }
        );
      }
    }

    // Challenge applicability
    if (challengeId && coupon.applicableChallenges.length > 0) {
      const isChallengeValid = coupon.applicableChallenges.some(
        (c) => c.id === challengeId
      );

      if (!isChallengeValid) {
        return NextResponse.json(
          { valid: false, message: "Coupon not applicable for this challenge." },
          { status: 400 }
        );
      }
    }

    // 5. Currency applicability
    if (coupon.applicableCurrencies && coupon.applicableCurrencies.length > 0) {
      const isCurrencyValid = coupon.applicableCurrencies.includes(currency);
      if (!isCurrencyValid) {
        return NextResponse.json(
          {
            valid: false,
            message: `Coupon only valid for ${coupon.applicableCurrencies.join(", ")} payments.`,
          },
          { status: 400 }
        );
      }
    }

    // (Optional) Use billingCountry & autoApplyConditions similar to auto-apply if you want extra conditions
    // if (coupon.autoApplyConditions) { ... }

    // 6. Success
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.couponCode,
        type: coupon.type, // "PERCENTAGE" | "FIXED" | "FREE_DURATION"
        discountPercentage: coupon.discountPercentage,
        discountAmountUSD: coupon.discountAmountUSD,
        discountAmountINR: coupon.discountAmountINR,
        freeDays: coupon.freeDays,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error("Coupon Verification Error:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
