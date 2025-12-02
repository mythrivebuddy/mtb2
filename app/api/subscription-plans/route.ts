// api/subscription-plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRole } from "@/lib/utils/auth";
import { Role, SubscriptionPlan } from "@prisma/client";

export const GET = async (req:NextRequest) => {
    // Todo will add the user type based filtering later
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === Role.USER) {
      const subscriptionPlans = await prisma.subscriptionPlan.findMany({
        where:{isActive:true},
      });
  
      return NextResponse.json(subscriptionPlans);

    }
    // For admin, return all plans
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscriptionPlans);
  } catch (error) {
    console.log("Error in subscription plans route:", error);
    return NextResponse.json({ error: "Error fetching subscription plans" }, { status: 500 });
  }
}

// for creating plans from admin only
export const POST = async (req:NextRequest) => {
  try {
     await checkRole("ADMIN");
    const {
      plan_name,
      user_type,
      billing_cycle,
      amountINR,
      amountUSD,
      description
    } = await req.json();

    const createdPlan = await prisma.subscriptionPlan.create({
      data:{
        name: plan_name,
        userType: user_type,
        interval: billing_cycle,
        amountINR: amountINR,
        amountUSD: amountUSD,
        description
      }
    })

    return NextResponse.json(createdPlan, { status: 201 });

  } catch (error) {
     console.log("Error while creating subscription plans:", error);
    return NextResponse.json({ error: "Error while creating subscription plans" }, { status: 500 });
  }
}

export const PATCH = async (req: NextRequest) => {
  try {
    await checkRole("ADMIN");
    const body = await req.json();
    const {
      id,
      plan_name,
      user_type,
      billing_cycle,
      amountINR,
      amountUSD,
      description,
      isActive,
      gstEnabled,
      gstPercentage,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required for updates" }, { status: 400 });
    }

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Prepare update data object (dynamic update)
    const updateData :any = {
        name: plan_name,
        userType: user_type,
        interval: billing_cycle,
        amountINR: Number(amountINR),
        amountUSD: Number(amountUSD),
        description: description,
        gstEnabled: gstEnabled,
        gstPercentage: Number(gstPercentage),
    };

    // Only update isActive if it was explicitly sent in the payload
    if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      { error: "Error updating subscription plan" },
      { status: 500 }
    );
  }
};
