import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AutoApplyConditions = {
  country?: string;
  notCountry?: string;
  userType?: string;
  [key: string]: unknown; // allows future keys without using any
};


function getFixedAmount(
  coupon: {
    discountAmountUSD?: number | null;
    discountAmountINR?: number | null;
  },
  currency: string
): number {
  return currency === "USD"
    ? coupon.discountAmountUSD || 0
    : coupon.discountAmountINR || 0;
}

export async function POST(req: Request) {
  try {
    const { planId, challengeId, currency, billingCountry, userType, userId } = await req.json();

    if (!planId && !challengeId) {
      return NextResponse.json(
        { coupon: null, message: "Plan or Challenge required" },
        { status: 400 }
      );
    }
    const now = new Date();

    // 1. Fetch auto-apply coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        autoApply: true,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        redemptions: {
          none: { userId } // 👈 key line
        }
      },
      include: {
        applicablePlans: { select: { id: true } },
        applicableChallenges: { select: { id: true } },
        _count: { select: { redemptions: true } },
      },
    });

    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ coupon: null });
    }



    // 2. Filter coupons
    const validCoupons = coupons.filter((coupon) => {
      // A. Global usage limit
      if (coupon.scope === "CHALLENGE" && !challengeId) {
        return false;
      }

      if (coupon.scope === "SUBSCRIPTION" && !planId) {
        return false;
      }
      if (coupon.maxGlobalUses && (coupon._count?.redemptions || 0) >= coupon.maxGlobalUses) {
        return false;
      }

      // B. Plan applicability
      // Plan filter
      if (planId && coupon.applicablePlans.length > 0) {
        const isPlanValid = coupon.applicablePlans.some((p) => p.id === planId);
        if (!isPlanValid) return false;
      }

      // Challenge filter
      if (challengeId && coupon.applicableChallenges.length > 0) {
        const isChallengeValid = coupon.applicableChallenges.some(
          (c) => c.id === challengeId
        );
        if (!isChallengeValid) return false;
      }

      // C. Currency applicability
      if (coupon.applicableCurrencies && coupon.applicableCurrencies.length > 0) {
        const isCurrencyValid = coupon.applicableCurrencies.includes(currency);
        if (!isCurrencyValid) return false;
      }

      // D. Additional JSON conditions
      if (coupon.autoApplyConditions) {
        const conditions = coupon.autoApplyConditions as AutoApplyConditions;

        // Exact country match
        if (conditions.country && conditions.country !== billingCountry) {
          return false;
        }

        // Excluded country
        if (conditions.notCountry && conditions.notCountry === billingCountry) {
          return false;
        }

        // User type
        if (conditions.userType && userType && conditions.userType !== userType) {
          return false;
        }
      }

      return true;
    });

    if (validCoupons.length === 0) {
      return NextResponse.json({ coupon: null });
    }

    // 3. Select "best" coupon
    const bestCoupon = validCoupons.sort((a, b) => {
      if (a.type === "FREE_DURATION" && b.type !== "FREE_DURATION") return -1;
      if (b.type === "FREE_DURATION" && a.type !== "FREE_DURATION") return 1;

      // Higher percentage first
      if (a.type === "PERCENTAGE" && b.type === "PERCENTAGE") {
        return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      }

      // Fixed discounts – higher first
      if (a.type === "FIXED" && b.type === "FIXED") {
        return getFixedAmount(b, currency) - getFixedAmount(a, currency);
      }

      return 0;
    })[0];

    return NextResponse.json({
      coupon: {
        id: bestCoupon.id,
        code: bestCoupon.couponCode,
        type: bestCoupon.type, // "PERCENTAGE" | "FIXED" | "FREE_DURATION"
        discountPercentage: bestCoupon.discountPercentage,
        discountAmountUSD: bestCoupon.discountAmountUSD,
        discountAmountINR: bestCoupon.discountAmountINR,
        freeDays: bestCoupon.freeDays,
        description: bestCoupon.description,
      },
    });
  } catch (error) {
    console.error("Auto-Apply Error:", error);
    return NextResponse.json({ coupon: null, message: "Internal server error" }, { status: 500 });
  }
}
