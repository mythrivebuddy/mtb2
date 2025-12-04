import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AutoApplyConditions = {
  country?: string;
  notCountry?: string;
  userType?: string;
  [key: string]: unknown; // allows future keys without using any
};


export async function POST(req: Request) {
  try {
    const { planId, currency, billingCountry, userType } = await req.json();

    if (!planId) {
      return NextResponse.json({ coupon: null, message: "Plan ID required" }, { status: 400 });
    }

    const now = new Date();

    // 1. Fetch auto-apply coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        autoApply: true,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        applicablePlans: { select: { id: true } },
        _count: { select: { redemptions: true } },
      },
    });

    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ coupon: null });
    }

    // 2. Filter coupons
    const validCoupons = coupons.filter((coupon) => {
      // A. Global usage limit
      if (coupon.maxGlobalUses && (coupon._count?.redemptions || 0) >= coupon.maxGlobalUses) {
        return false;
      }

      // B. Plan applicability
      if (coupon.applicablePlans.length > 0) {
        const isPlanValid = coupon.applicablePlans.some((p) => p.id === planId);
        if (!isPlanValid) return false;
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
        return (b.discountAmount || 0) - (a.discountAmount || 0);
      }

      return 0;
    })[0];

    return NextResponse.json({
      coupon: {
        id: bestCoupon.id,
        code: bestCoupon.couponCode,
        type: bestCoupon.type, // "PERCENTAGE" | "FIXED" | "FREE_DURATION"
        discountPercentage: bestCoupon.discountPercentage,
        discountAmount: bestCoupon.discountAmount,
        freeDays: bestCoupon.freeDays,
        description: bestCoupon.description,
      },
    });
  } catch (error) {
    console.error("Auto-Apply Error:", error);
    return NextResponse.json({ coupon: null, message: "Internal server error" }, { status: 500 });
  }
}
