import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Fields allowed to update
    const {
        status,
        endDate,
        maxGlobalUses,
        autoApply,
        autoApplyConditions
    } = body;

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        status,
        endDate: endDate ? new Date(endDate) : undefined,
        maxGlobalUses: maxGlobalUses ? parseInt(maxGlobalUses) : undefined,
        autoApply,
        autoApplyConditions
      },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
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
            data: { status: "INACTIVE" }
        });
        return NextResponse.json({ message: "Coupon used previously. Marked as INACTIVE." });
    } else {
        // Hard Delete
        await prisma.coupon.delete({
            where: { id }
        });
        return NextResponse.json({ message: "Coupon deleted permanently." });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}