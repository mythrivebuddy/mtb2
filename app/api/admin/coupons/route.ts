import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CouponType,
  CouponUserType,
  SubscriptionPlanCurrency,
} from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    await checkRole("ADMIN");

    const coupons = await prisma.coupon.findMany({
      where: {
        creatorUserId: null,
      },
      include: {
        _count: {
          select: { redemptions: true },
        },
        applicablePlans: {
          select: { id: true, name: true },
        },
        applicableChallenges: {
          select: { id: true, title: true },
        },
        applicableMmpPrograms: {
          select: { id: true, name: true },
        },
        applicableStoreProducts: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Destructure and validate
    const {
      couponCode,
      type,
      discountPercentage,
      discountAmountINR,
      discountAmountUSD,
      discountAmountGP,
      freeDays,
      applicableUserTypes, // Array of ENUMs
      applicablePlanIds, // Array of Strings (IDs)
      applicableChallengeIds,
      applicableMmpProgramIds,
      applicableStoreProductIds,
      applicableCurrencies, // Array of ENUMs
      firstCycleOnly,
      multiCycle,
      startDate,
      endDate,
      maxGlobalUses,
      maxUsesPerUser,
      autoApply,
      autoApplyConditions,
      description,
      scope,
    } = body;

    // Basic Validation
    if (!couponCode || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const isChallengeCoupon = scope === "CHALLENGE";

    if (
      !["SUBSCRIPTION", "CHALLENGE", "MMP_PROGRAM", "STORE_PRODUCT"].includes(
        scope,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid coupon scope" },
        { status: 400 },
      );
    }
    if (type === "FIXED") {
      if (!discountAmountUSD && !discountAmountINR && !discountAmountGP) {
        return NextResponse.json(
          { error: "At least one discount amount is required" },
          { status: 400 },
        );
      }
    }

    const safeFirstCycleOnly = isChallengeCoupon ? true : !!firstCycleOnly;
    const safeMultiCycle = isChallengeCoupon ? false : !!multiCycle;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { couponCode: couponCode.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 },
      );
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        couponCode: couponCode.trim().toUpperCase(),
        type: type as CouponType,
        description,
        status: "ACTIVE", // Default to active on creation

        // Discount Logic
        discountPercentage: discountPercentage
          ? parseFloat(discountPercentage)
          : null,
        discountAmountUSD: discountAmountUSD
          ? parseFloat(discountAmountUSD)
          : null,
        discountAmountINR: discountAmountINR
          ? parseFloat(discountAmountINR)
          : null,
        discountAmountGP: discountAmountGP
          ? parseFloat(discountAmountGP)
          : null,
        freeDays: freeDays ? parseInt(freeDays) : null,
        scope: scope,
        // Applicability
        applicableUserTypes: applicableUserTypes as CouponUserType[], // Postgres scalar list
        applicableCurrencies:
          applicableCurrencies as SubscriptionPlanCurrency[],
        firstCycleOnly: safeFirstCycleOnly,
        multiCycle: safeMultiCycle,

        // Plans
        applicablePlans:
          scope === "SUBSCRIPTION" && applicablePlanIds?.length
            ? { connect: applicablePlanIds.map((id: string) => ({ id })) }
            : undefined,

        // Challenges
        applicableChallenges:
          scope === "CHALLENGE" && applicableChallengeIds?.length
            ? { connect: applicableChallengeIds.map((id: string) => ({ id })) }
            : undefined,

        // MMP
        applicableMmpPrograms:
          scope === "MMP_PROGRAM" && applicableMmpProgramIds?.length
            ? { connect: applicableMmpProgramIds.map((id: string) => ({ id })) }
            : undefined,

        // Store
        applicableStoreProducts:
          scope === "STORE_PRODUCT" && applicableStoreProductIds?.length
            ? {
                connect: applicableStoreProductIds.map((id: string) => ({
                  id,
                })),
              }
            : undefined,

        // Validity
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxGlobalUses: maxGlobalUses ? parseInt(maxGlobalUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : 1,

        // Auto Apply
        autoApply: !!autoApply,
        autoApplyConditions: autoApplyConditions || {},
      },
    });

    return NextResponse.json(newCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 },
    );
  }
}
