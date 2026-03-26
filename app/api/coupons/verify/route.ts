import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { checkRole } from "@/lib/utils/auth";
import { SubscriptionPlanCurrency } from "@prisma/client";

type CouponUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR" | "ALL";

export async function POST(req: Request) {
  try {
    const session = await checkRole("USER");
    if (!session || !session.user.userType) {
      return NextResponse.json(
        { valid: false, message: "Not eligible " },
        { status: 400 },
      );
    }
    const userId = session.user.id;
    const body = (await req.json()) as {
      code: string;
      planId?: string;
      currency: SubscriptionPlanCurrency | "GP";
      challengeId?: string;
      mmp_programId?: string;
      storeItemIds?: string[];
    };

    const { code, planId, currency, challengeId, mmp_programId, storeItemIds } =
      body;

    if (!code || (!planId && !challengeId && !mmp_programId && !storeItemIds)) {
      return NextResponse.json(
        { valid: false, message: "Missing code or details." },
        { status: 400 },
      );
    }

    const now = new Date();

    // 1. Fetch coupon
    const coupon = await prisma.coupon.findUnique({
      where: { couponCode: code.toUpperCase() },
      include: {
        applicablePlans: { select: { id: true } },
        applicableChallenges: { select: { id: true } },
        applicableMmpPrograms: { select: { id: true } },
        applicableStoreProducts: { select: { id: true } },
        _count: { select: { redemptions: true } },
      },
    });
    const userType = session.user.userType as CouponUserType;
    // 2. Basic checks
    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: "Invalid coupon code." },
        { status: 404 },
      );
    }
    //  Ownership Validation via User Role
    let resourceCreatorId: string | null = null;
    let resourceCreatorRole: string | null = null;

    // Challenge
    if (challengeId) {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: {
          creatorId: true,
          creator: {
            select: { role: true },
          },
        },
      });

      resourceCreatorId = challenge?.creatorId || null;
      resourceCreatorRole = challenge?.creator?.role || null;
    }

    // MMP Program
    if (mmp_programId) {
      const program = await prisma.program.findUnique({
        where: { id: mmp_programId },
        select: {
          createdBy: true,
          creator: {
            select: { role: true },
          },
        },
      });

      resourceCreatorId = program?.createdBy || null;
      resourceCreatorRole = program?.creator?.role || null;
    }

    // Store Product
    const products = await prisma.item.findMany({
      where: {
        id: { in: storeItemIds },
      },
      select: {
        id: true,
        createdByUserId: true,
        creator: { select: { role: true } },
      },
    });
    const validItems: string[] = [];

    for (const product of products) {
      const creatorId = product.createdByUserId;
      const creatorRole = product.creator?.role;

      if (coupon.creatorUserId) {
        // Creator coupon → only creator's products
        if (coupon.creatorUserId === creatorId) {
          validItems.push(product.id);
        }
      } else {
        // Platform coupon → only admin products
        if (creatorRole === "ADMIN") {
          validItems.push(product.id);
        }
      }
    }

    if (validItems.length === 0) {
      return NextResponse.json(
        { valid: false, message: "Coupon not applicable to any cart items." },
        { status: 400 },
      );
    }

    //  MAIN OWNERSHIP RULE
    if (coupon.creatorUserId) {
      // Creator coupon → must match owner
      if (coupon.creatorUserId !== resourceCreatorId) {
        return NextResponse.json(
          {
            valid: false,
            message: "This coupon is not valid for this checkout.",
          },
          { status: 403 },
        );
      }
    } else {
      // Platform coupon → only for admin-created resources
      if (resourceCreatorRole !== "ADMIN") {
        return NextResponse.json(
          { valid: false, message: "Platform coupon not valid for this item." },
          { status: 403 },
        );
      }
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
    if (coupon.scope === "MMP_PROGRAM" && !mmp_programId) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is only valid for MMP programs",
      });
    }
    if (coupon.scope === "STORE_PRODUCT" && !storeItemIds) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is only valid for store products",
      });
    }
    // 6. User Type applicability
    if (coupon.applicableUserTypes?.length > 0) {
      const isUserTypeValid = coupon.applicableUserTypes.includes(userType);
      const isAll = coupon.applicableUserTypes.includes("ALL");

      if (!isUserTypeValid && !isAll) {
        return NextResponse.json(
          {
            valid: false,
            message: "This coupon is not valid for your account type.",
          },
          { status: 400 },
        );
      }
    }
    const userUses = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (coupon.maxUsesPerUser && userUses >= coupon.maxUsesPerUser) {
      return NextResponse.json(
        {
          valid: false,
          message: "You have already used this coupon.",
        },
        { status: 400 },
      );
    }

    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { valid: false, message: "This coupon is inactive or expired." },
        { status: 400 },
      );
    }

    if (now < coupon.startDate || now > coupon.endDate) {
      return NextResponse.json(
        { valid: false, message: "Coupon is not valid at this time." },
        { status: 400 },
      );
    }

    // 3. Usage limits
    if (
      coupon.maxGlobalUses &&
      (coupon._count?.redemptions || 0) >= coupon.maxGlobalUses
    ) {
      return NextResponse.json(
        { valid: false, message: "Coupon usage limit reached." },
        { status: 400 },
      );
    }

    // 4. Plan applicability
    // Plan applicability
    if (planId && coupon.applicablePlans.length > 0) {
      const isPlanValid = coupon.applicablePlans.some((p) => p.id === planId);
      if (!isPlanValid) {
        return NextResponse.json(
          { valid: false, message: "Coupon not applicable for this plan." },
          { status: 400 },
        );
      }
    }

    // Challenge applicability
    if (challengeId && coupon.applicableChallenges.length > 0) {
      const isChallengeValid = coupon.applicableChallenges.some(
        (c) => c.id === challengeId,
      );

      if (!isChallengeValid) {
        return NextResponse.json(
          {
            valid: false,
            message: "Coupon not applicable for this challenge.",
          },
          { status: 400 },
        );
      }
    }
    // MMP Program applicability
    if (mmp_programId && coupon.applicableMmpPrograms.length > 0) {
      const isProgramValid = coupon.applicableMmpPrograms.some(
        (p) => p.id === mmp_programId,
      );

      if (!isProgramValid) {
        return NextResponse.json(
          { valid: false, message: "Coupon not applicable for this program." },
          { status: 400 },
        );
      }
    }

    // Store Product applicability
    if (coupon.applicableStoreProducts?.length > 0) {
      const applicableIds = coupon.applicableStoreProducts.map((p) => p.id);

      const hasApplicableItem = storeItemIds?.some((id) =>
        applicableIds.includes(id),
      );

      if (!hasApplicableItem) {
        return NextResponse.json(
          {
            valid: false,
            message: "Coupon not applicable for selected items.",
          },
          { status: 400 },
        );
      }
    }

    // 5. Currency applicability
    // Currency applicability
    // 5. Currency applicability
    if (currency !== "GP") {
      if (
        coupon.applicableCurrencies &&
        coupon.applicableCurrencies.length > 0
      ) {
        const isCurrencyValid = coupon.applicableCurrencies.includes(
          currency as SubscriptionPlanCurrency,
        );

        if (!isCurrencyValid) {
          return NextResponse.json(
            {
              valid: false,
              message: `Coupon only valid for ${coupon.applicableCurrencies.join(", ")} payments.`,
            },
            { status: 400 },
          );
        }
      }
    }

    // (Optional) Use billingCountry & autoApplyConditions similar to auto-apply if you want extra conditions
    // if (coupon.autoApplyConditions) { ... }

    // 6. Success
    return NextResponse.json({
      valid: true,
      applicableItemIds: validItems,
      coupon: {
        id: coupon.id,
        code: coupon.couponCode,
        type: coupon.type, // "PERCENTAGE" | "FIXED" | "FREE_DURATION"
        discountPercentage: coupon.discountPercentage,
        discountAmountUSD: coupon.discountAmountUSD,
        discountAmountINR: coupon.discountAmountINR,
        discountAmountGP: coupon.discountAmountGP,
        freeDays: coupon.freeDays,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error("Coupon Verification Error:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}
