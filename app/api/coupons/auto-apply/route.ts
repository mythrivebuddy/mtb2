import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AutoApplyConditions = {
  country?: string;
  notCountry?: string;
  userType?: string;
  [key: string]: unknown; // allows future keys without using any
};
type AutoApplyRequest = {
  planId?: string;
  challengeId?: string;
  mmp_programId?: string;
  currency: StoreCurrency;
  billingCountry?: string;
  userType?: CouponUserType;
  userId: string;
  storeItemIds?: string[];
};
type CouponCurrency = "INR" | "USD";
type StoreCurrency = "INR" | "USD" | "GP";
type CouponUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR" | "ALL";

function getFixedAmount(
  coupon: {
    discountAmountUSD?: number | null;
    discountAmountINR?: number | null;
    discountAmountGP?: number | null;
  },
  currency: string,
): number {
  if (currency === "USD") return coupon.discountAmountUSD || 0;
  if (currency === "INR") return coupon.discountAmountINR || 0;
  if (currency === "GP") return coupon.discountAmountGP || 0;
  return 0;
}

export async function POST(req: Request) {
  try {
    const {
      planId,
      challengeId,
      mmp_programId,
      currency,
      billingCountry,
      userType,
      userId,
      storeItemIds,
    } = (await req.json()) as AutoApplyRequest;

    if (!planId && !challengeId && !mmp_programId && !storeItemIds) {
      return NextResponse.json(
        { coupon: null, message: "Plan, Challenge or MMP Program required" },
        { status: 400 },
      );
    }
    const now = new Date();
    let creatorId: string | null = null;
    let creatorRole: string | null = null;

    if (challengeId) {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: {
          creatorId: true,
          creator: {
            select: {
              role: true,
            },
          },
        },
      });

      creatorId = challenge?.creatorId || null;
      creatorRole = challenge?.creator?.role || null;
    }
    // 1. Fetch auto-apply coupons

    const couponWhere: Prisma.CouponWhereInput = {
      autoApply: true,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      redemptions: {
        none: { userId },
      },
    };

    // Admin challenge → platform coupons
    const role = creatorRole?.toUpperCase();

    if (role === "ADMIN") {
      couponWhere.creatorUserId = null;
    } else if (creatorId) {
      couponWhere.creatorUserId = creatorId;
    }
    // Coach challenge → only that coach coupons
    else if (creatorId) {
      couponWhere.creatorUserId = creatorId;
    }

    const coupons = await prisma.coupon.findMany({
      where: couponWhere,
      include: {
        applicablePlans: { select: { id: true } },
        applicableChallenges: { select: { id: true } },
        applicableMmpPrograms: { select: { id: true } },
        applicableStoreProducts: { select: { id: true } },
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
      if (coupon.scope === "MMP_PROGRAM" && !mmp_programId) {
        return false;
      }
      if (
        coupon.scope === "STORE_PRODUCT" &&
        (!storeItemIds || storeItemIds.length === 0)
      ) {
        return false;
      }
      if (
        coupon.maxGlobalUses &&
        (coupon._count?.redemptions || 0) >= coupon.maxGlobalUses
      ) {
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
          (c) => c.id === challengeId,
        );
        if (!isChallengeValid) return false;
      }
      if (mmp_programId && coupon.applicableMmpPrograms?.length > 0) {
        const isProgramValid = coupon.applicableMmpPrograms.some(
          (p) => p.id === mmp_programId,
        );

        if (!isProgramValid) return false;
      }
      if (storeItemIds && coupon.applicableStoreProducts?.length > 0) {
        const applicableIds = coupon.applicableStoreProducts.map((p) => p.id);

        const hasApplicableItem = storeItemIds.some((id) =>
          applicableIds.includes(id),
        );

        if (!hasApplicableItem) return false;
      }
      // C. Currency applicability
      // Skip currency validation for GP store products
      if (!(coupon.scope === "STORE_PRODUCT" && currency === "GP")) {
        if (
          coupon.applicableCurrencies &&
          coupon.applicableCurrencies.length > 0
        ) {
          const isCurrencyValid = coupon.applicableCurrencies.includes(
            currency as CouponCurrency,
          );
          if (!isCurrencyValid) return false;
        }
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
        if (
          conditions.userType &&
          userType &&
          conditions.userType !== userType
        ) {
          return false;
        }
      }
      if (coupon.applicableUserTypes && coupon.applicableUserTypes.length > 0) {
        if (!userType) return false;

        const isUserTypeValid = coupon.applicableUserTypes.includes(userType);
        const isAll = coupon.applicableUserTypes.includes("ALL");

        if (!isUserTypeValid && !isAll) return false;
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
    const applicableItemIds: string[] = [];

    if (storeItemIds && storeItemIds.length > 0) {
      const products = await prisma.item.findMany({
        where: { id: { in: storeItemIds } },
        select: {
          id: true,
          createdByUserId: true,
          creator: { select: { role: true } },
        },
      });

      const applicableIds =
        bestCoupon.applicableStoreProducts?.map((p) => p.id) || [];

      for (const product of products) {
        const creatorId = product.createdByUserId;
        const creatorRole = product.creator?.role;

        // Creator coupon → only creator's products
        if (bestCoupon.creatorUserId) {
          if (
            bestCoupon.creatorUserId === creatorId &&
            (applicableIds.length === 0 || applicableIds.includes(product.id))
          ) {
            applicableItemIds.push(product.id);
          }
        } else {
          // Platform coupon → only admin products
          if (
            creatorRole === "ADMIN" &&
            (applicableIds.length === 0 || applicableIds.includes(product.id))
          ) {
            applicableItemIds.push(product.id);
          }
        }
      }
    }

    return NextResponse.json({
      coupon: {
        id: bestCoupon.id,
        code: bestCoupon.couponCode,
        type: bestCoupon.type,
        discountPercentage: bestCoupon.discountPercentage,
        discountAmountUSD: bestCoupon.discountAmountUSD,
        discountAmountINR: bestCoupon.discountAmountINR,
        discountAmountGP: bestCoupon.discountAmountGP,
        freeDays: bestCoupon.freeDays,
        description: bestCoupon.description,
      },
      applicableItemIds,
    });
  } catch (error) {
    console.error("Auto-Apply Error:", error);
    return NextResponse.json(
      { coupon: null, message: "Internal server error" },
      { status: 500 },
    );
  }
}
