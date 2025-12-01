// api/subscription-plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req:NextRequest) => {
    // Todo will add the user type based filtering later
  try {
    const subscriptionPlans = await prisma.subscriptionPlan.findMany();
    return NextResponse.json(subscriptionPlans);
  } catch (error) {
    console.log("Error in subscription plans route:", error);
    return NextResponse.json({ error: "Error fetching subscription plans" }, { status: 500 });
  }
}
