import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to your prisma instance
import { CouponType, CouponUserType, SubscriptionPlanCurrency } from "@prisma/client";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: {
          select: { redemptions: true },
        },
        applicablePlans: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
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
      discountAmount,
      freeDays,
      applicableUserTypes, // Array of ENUMs
      applicablePlanIds,   // Array of Strings (IDs)
      applicableCurrencies, // Array of ENUMs
      firstCycleOnly,
      multiCycle,
      startDate,
      endDate,
      maxGlobalUses,
      maxUsesPerUser,
      autoApply,
      autoApplyConditions,
      description
    } = body;

    // Basic Validation
    if (!couponCode || !type || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        couponCode: couponCode.toUpperCase(),
        type: type as CouponType,
        description,
        status: "ACTIVE", // Default to active on creation
        
        // Discount Logic
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        freeDays: freeDays ? parseInt(freeDays) : null,

        // Applicability
        applicableUserTypes: applicableUserTypes as CouponUserType[], // Postgres scalar list
        applicableCurrencies: applicableCurrencies as SubscriptionPlanCurrency[],
        firstCycleOnly: !!firstCycleOnly,
        multiCycle: !!multiCycle,
        
        // Connect Plans (Many-to-Many)
        applicablePlans: {
            connect: applicablePlanIds?.map((id: string) => ({ id })) || []
        },

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
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}