// /api/coupons/coach/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CouponType } from "@prisma/client"
import { checkRole } from "@/lib/utils/auth"

export async function GET() {
    try {
        const session = await checkRole("USER")
        if (session.user.userType != "COACH") {
            return NextResponse.json({ message: "You are not allowed to make this action" })
        }
        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const challenges = await prisma.challenge.findMany({
            where: {
                creatorId: userId,
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
        })

        return NextResponse.json(challenges)
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Failed to fetch challenges" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const session = await checkRole("USER")
        if (session.user.userType != "COACH") {
            return NextResponse.json({ message: "You are not allowed to make this action" })
        }

        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()

        const {
            couponCode,
            type,
            discountPercentage,
            discountAmountINR,
            discountAmountUSD,
            freeDays,
            applicableChallengeIds,
            startDate,
            endDate,
            maxGlobalUses,
            maxUsesPerUser,
            description,
            autoApply
        } = body

        if (!couponCode || !type || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        if (!applicableChallengeIds?.length) {
            return NextResponse.json(
                { error: "At least one challenge required" },
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

        // Verify coach owns the challenges
        const ownedChallenges = await prisma.challenge.findMany({
            where: {
                id: { in: applicableChallengeIds },
                creatorId: userId,
            },
            select: { id: true },
        })

        if (ownedChallenges.length !== applicableChallengeIds.length) {
            return NextResponse.json(
                { error: "Invalid challenge selection" },
                { status: 403 }
            )
        }

        const newCoupon = await prisma.coupon.create({
            data: {
                couponCode: couponCode.trim().toUpperCase(),
                type: type as CouponType,
                description,
                scope: "CHALLENGE",
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

                applicableChallenges: {
                    connect: applicableChallengeIds.map((id: string) => ({ id })),
                },
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