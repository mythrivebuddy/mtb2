import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponType, CouponStatus } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await checkRole("USER");

    if (session.user.userType !== "COACH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await req.json();

    // Ensure coupon belongs to this coach
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id,
        creatorUserId: userId,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        { error: "Coupon not found or unauthorized" },
        { status: 404 },
      );
    }

    const {
      description,
      type,
      discountPercentage,
      discountAmountINR,
      discountAmountUSD,
      freeDays,
      maxGlobalUses,
      maxUsesPerUser,
      startDate,
      endDate,
      applicableChallengeIds,
      applicableMmpProgramIds,
      applicableStoreProductIds,
      applicableUserTypes,
      applicableCurrencies,
      autoApply,
    } = body;

    const data = {
      ...(description !== undefined && { description }),
      ...(type && { type: type as CouponType }),

      ...(discountPercentage !== undefined && {
        discountPercentage: discountPercentage
          ? Number(discountPercentage)
          : null,
      }),

      ...(discountAmountINR !== undefined && {
        discountAmountINR: discountAmountINR ? Number(discountAmountINR) : null,
      }),

      ...(discountAmountUSD !== undefined && {
        discountAmountUSD: discountAmountUSD ? Number(discountAmountUSD) : null,
      }),

      ...(freeDays !== undefined && {
        freeDays: freeDays ? Number(freeDays) : null,
      }),

      ...(maxGlobalUses !== undefined && {
        maxGlobalUses: maxGlobalUses ? Number(maxGlobalUses) : null,
      }),

      ...(maxUsesPerUser !== undefined && { maxUsesPerUser }),

      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),

      ...(autoApply !== undefined && { autoApply }),

      ...(applicableUserTypes !== undefined && { applicableUserTypes }),
      ...(applicableCurrencies !== undefined && { applicableCurrencies }),
    };

    // Relations update
    if (applicableChallengeIds) {
      data.applicableChallenges = {
        set: applicableChallengeIds.map((id: string) => ({ id })),
      };
    }

    if (applicableMmpProgramIds) {
      data.applicableMmpPrograms = {
        set: applicableMmpProgramIds.map((id: string) => ({ id })),
      };
    }

    if (applicableStoreProductIds) {
      data.applicableStoreProducts = {
        set: applicableStoreProductIds.map((id: string) => ({ id })),
      };
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error(error);
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
    const session = await checkRole("USER");

    if (session.user.userType !== "COACH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = session.user.id;
    const { id } = await params;

    // Ensure ownership
    const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        creatorUserId: userId,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found or unauthorized" },
        { status: 404 },
      );
    }

    // Check usage
    const redemptionCount = await prisma.couponRedemption.count({
      where: { couponId: id },
    });

    if (redemptionCount > 0) {
      await prisma.coupon.update({
        where: { id },
        data: { status: CouponStatus.INACTIVE },
      });

      return NextResponse.json(
        {
          message: "Coupon used previously. Marked as INACTIVE.",
        },
        { status: 200 },
      );
    } else {
      await prisma.coupon.delete({
        where: { id },
      });

      return NextResponse.json(
        {
          message: "Coupon deleted permanently.",
        },
        { status: 200 },
      );
    }
  } catch (error:unknown) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
