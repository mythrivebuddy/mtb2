// app/api/subscription-plans/toggle-gst/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

const DEFAULT_GST = 18;

export const PATCH = async (req: NextRequest) => {
  try {
    await checkRole("ADMIN");
    const body = await req.json();
    const { id, gstEnabled } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // 1. Get the current plan to check existing percentage
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    let gstPercentage = existingPlan.gstPercentage;

    // 2. Logic: If enabling and currently 0, set to default (18). 
    // If disabling, leave the percentage as is (so we remember it if re-enabled).
    if (gstEnabled && (gstPercentage === 0 || gstPercentage === null)) {
      gstPercentage = DEFAULT_GST;
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        gstEnabled,
        gstPercentage,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error toggling GST:", error);
    return NextResponse.json(
      { error: "Error updating GST status" },
      { status: 500 }
    );
  }
};