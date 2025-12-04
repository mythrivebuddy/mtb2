// /api/subscription/toggle-activation
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export const PATCH = async (req: NextRequest) => {
  try {
    await checkRole("ADMIN");
    const { id,activeStatus } = await req.json();
    const deactivatedPlan =  await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive:activeStatus},
    });
    return NextResponse.json(deactivatedPlan);
  }catch (error) {
    console.log("Error while deactivating subscription plan:", error);
    return NextResponse.json({ error: "Error while deactivating subscription plan" }, { status: 500 });
  }
}