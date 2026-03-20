// /api/coupons/coach/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CouponType, CouponScope, ChallengeJoiningType } from "@prisma/client"
import { checkRole } from "@/lib/utils/auth"

export async function GET() {
  try {
    const session = await checkRole("USER");

    if (session.user.userType !== "COACH") {
      return NextResponse.json(
        { message: "You are not allowed to make this action" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [challenges, coupons] = await Promise.all([
      prisma.challenge.findMany({
        where: {
          creatorId: userId,
          challengeJoiningType:ChallengeJoiningType.PAID
        },
        select: {
          id: true,
          title: true,
          challengeJoiningFee: true,
          challengeJoiningFeeCurrency: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.coupon.findMany({
        where: {
          creatorUserId: userId,
        },
        select: {
          id: true,
          couponCode: true,
          type: true,
          status: true,
          scope: true,
          autoApply: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);
    console.log({
      userId,
      challenges
    });
    
    return NextResponse.json({
      challenges,
      coupons,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await checkRole("USER")
    if (session.user.userType != "COACH") {
      return NextResponse.json({ message: "You are not allowed to make this action" }, { status: 403 })
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const {
      couponCode,
      type,
      scope,
      discountPercentage,
      discountAmountINR,
      discountAmountUSD,
      freeDays,
      applicableChallengeIds,
      applicableMmpProgramIds, // Ensure the frontend sends this exact key
      startDate,
      endDate,
      maxGlobalUses,
      maxUsesPerUser,
      description,
      autoApply
    } = body

    if (!couponCode || !type || !scope || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check coupon uniqueness
    const existingCoupon = await prisma.coupon.findUnique({
      where: { couponCode: couponCode.toUpperCase() },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      )
    }

    // Verify ownership and valid selection based on scope
    if (scope === "CHALLENGE") {
      if (!applicableChallengeIds?.length) {
        return NextResponse.json(
          { error: "At least one challenge must be selected" },
          { status: 400 }
        )
      }

      const ownedChallenges = await prisma.challenge.findMany({
        where: {
          id: { in: applicableChallengeIds },
          creatorId: userId,
        },
        select: { id: true },
      })

      if (ownedChallenges.length !== applicableChallengeIds.length) {
        return NextResponse.json(
          { error: "Invalid challenge selection or unauthorized" },
          { status: 403 }
        )
      }
    } else if (scope === "MMP_PROGRAM") {
      if (!applicableMmpProgramIds?.length) {
        return NextResponse.json(
          { error: "At least one MMP Program must be selected" },
          { status: 400 }
        )
      }

      // Verify coach owns the MMP programs
      // If your Program model doesn't have a creatorId, you'll need to adjust or remove this check.
      const ownedPrograms = await prisma.program.findMany({
        where: {
          id: { in: applicableMmpProgramIds },
          createdBy: userId,
        },
        select: { id: true },
      })

      if (ownedPrograms.length !== applicableMmpProgramIds.length) {
        return NextResponse.json(
          { error: "Invalid MMP program selection or unauthorized" },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Invalid scope provided" },
        { status: 400 }
      )
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        couponCode: couponCode.trim().toUpperCase(),
        type: type as CouponType,
        description,
        scope: scope as CouponScope,
        status: "ACTIVE",

        discountPercentage: discountPercentage
          ? Number(discountPercentage)
          : null,

        discountAmountUSD: discountAmountUSD
          ? Number(discountAmountUSD)
          : null,

        discountAmountINR: discountAmountINR
          ? Number(discountAmountINR)
          : null,

        freeDays: freeDays ? Number(freeDays) : null,

        startDate: new Date(startDate),
        endDate: new Date(endDate),

        maxGlobalUses: maxGlobalUses ? Number(maxGlobalUses) : null,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,

        firstCycleOnly: true,
        multiCycle: false,

        autoApply: !!autoApply,

        creatorUserId: userId,
        challengeCreatorType: "COACH",

        // Dynamically connect challenges or programs based on scope
        applicableChallenges: scope === "CHALLENGE" && applicableChallengeIds?.length > 0 ? {
          connect: applicableChallengeIds.map((id: string) => ({ id })),
        } : undefined,

        applicableMmpPrograms: scope === "MMP_PROGRAM" && applicableMmpProgramIds?.length > 0 ? {
          connect: applicableMmpProgramIds.map((id: string) => ({ id })),
        } : undefined,
      },
    })

    return NextResponse.json(newCoupon)

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    )
  }
}