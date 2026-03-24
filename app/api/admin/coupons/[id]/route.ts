import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CouponStatus,
  CouponUserType,
  Prisma,
  SubscriptionPlanCurrency,
} from "@prisma/client";
import { CouponType } from "@prisma/client";

type UpdateCouponDTO = {
  couponCode?: string;
  description?: string;
  type?: string;
  discountPercentage?: string;
  discountAmountINR?: string;
  discountAmountUSD?: string;
  freeDays?: string;
  maxGlobalUses?: string;
  maxUsesPerUser?: number;
  startDate?: string;
  endDate?: string;

  applicablePlanIds?: string[];
  applicableChallengeIds?: string[];
  applicableMmpProgramIds?: string[];
  applicableStoreProductIds?: string[];

  applicableUserTypes?: CouponUserType[];
  applicableCurrencies?: SubscriptionPlanCurrency[];

  autoApply?: boolean;
  autoApplyConditions?: Prisma.JsonValue;
  status?: CouponStatus;
};

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const rawBody = await req.json();

    const body: UpdateCouponDTO = {
      ...rawBody,
      status: Object.values(CouponStatus).includes(rawBody.status)
        ? rawBody.status
        : undefined,
    };

    // Fields allowed to update
    const {
      couponCode,
      description,
      type,
      discountPercentage,
      discountAmountINR,
      discountAmountUSD,
      freeDays,
      maxGlobalUses,
      maxUsesPerUser,
      endDate,
      startDate,
      applicableMmpProgramIds,
      applicablePlanIds,
      applicableChallengeIds,
      applicableStoreProductIds,
      applicableCurrencies,
      applicableUserTypes,
      autoApply,
      autoApplyConditions,
      status,
    } = body;

    const data: Prisma.CouponUpdateInput = {
      ...(couponCode && { couponCode }),
      ...(description !== undefined && { description }),
      ...(type &&
        Object.values(CouponType).includes(type as CouponType) && {
          type: type as CouponType,
        }),

      ...(discountPercentage !== undefined && {
        discountPercentage: parseFloat(discountPercentage),
      }),

      ...(discountAmountINR && {
        discountAmountINR: parseFloat(discountAmountINR),
      }),

      ...(discountAmountUSD && {
        discountAmountUSD: parseFloat(discountAmountUSD),
      }),

      ...(freeDays && { freeDays: parseInt(freeDays) }),

      ...(maxGlobalUses && {
        maxGlobalUses: parseInt(maxGlobalUses),
      }),

      ...(maxUsesPerUser && { maxUsesPerUser }),

      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),

      ...(autoApply !== undefined && {
        autoApply,
        autoApplyConditions: autoApply
          ? (autoApplyConditions ?? {})
          : Prisma.DbNull,
      }),
      ...(status && { status }),
      ...(applicableUserTypes !== undefined && { applicableUserTypes }),
      ...(applicableCurrencies !== undefined && { applicableCurrencies }),
    };

    if (applicableMmpProgramIds) {
      data.applicableMmpPrograms = {
        set: applicableMmpProgramIds.map((id) => ({ id })),
      };
    }

    if (applicablePlanIds) {
      data.applicablePlans = {
        set: applicablePlanIds.map((id) => ({ id })),
      };
    }

    if (applicableChallengeIds) {
      data.applicableChallenges = {
        set: applicableChallengeIds.map((id) => ({ id })),
      };
    }
    if (applicableStoreProductIds) {
      data.applicableStoreProducts = {
        set: applicableStoreProductIds.map((id) => ({ id })),
      };
    }
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    // Check usage
    const redemptionCount = await prisma.couponRedemption.count({
      where: { couponId: id },
    });

    if (redemptionCount > 0) {
      // Soft Delete / Deactivate
      await prisma.coupon.update({
        where: { id },
        data: { status: CouponStatus.INACTIVE },
      });
      return NextResponse.json({
        message: "Coupon used previously. Marked as INACTIVE.",
      });
    } else {
      // Hard Delete
      await prisma.coupon.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Coupon deleted permanently." });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 },
    );
  }
}
