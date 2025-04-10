import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/utils/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { differenceInDays } from "date-fns";

// Schema for subscription request validation
const subscriptionSchema = z.object({
  planId: z.string().min(1),
});

/**
 * Calculate prorated upgrade price based on current plan and usage
 */
const calculateProratedPrice = (
  currentPlan: any,
  newPlan: any,
  currentPlanStart: Date
): number => {
  const currentPrice = parseFloat(currentPlan.price);
  const newPrice = parseFloat(newPlan.price);
  const now = new Date();

  // For lifetime plan upgrades
  if (newPlan.durationDays === null) {
    // If current plan is monthly
    if (currentPlan.durationDays === 30) {
      const daysUsed = differenceInDays(now, currentPlanStart);
      const daysRemaining = Math.max(0, currentPlan.durationDays - daysUsed);
      const refundAmount =
        (daysRemaining / currentPlan.durationDays) * currentPrice;
      return Math.max(0, newPrice - refundAmount);
    }

    // If current plan is yearly
    if (currentPlan.durationDays === 365) {
      const daysUsed = differenceInDays(now, currentPlanStart);
      const daysRemaining = Math.max(0, currentPlan.durationDays - daysUsed);
      const refundAmount =
        (daysRemaining / currentPlan.durationDays) * currentPrice;
      return Math.max(0, newPrice - refundAmount);
    }

    return newPrice;
  }

  // If upgrading from monthly to yearly
  if (currentPlan.durationDays === 30 && newPlan.durationDays === 365) {
    const daysUsed = differenceInDays(now, currentPlanStart);
    const daysRemaining = Math.max(0, currentPlan.durationDays - daysUsed);
    const refundAmount =
      (daysRemaining / currentPlan.durationDays) * currentPrice;
    return Math.max(0, newPrice - refundAmount);
  }

  return newPrice;
};

// GET: Fetch the current user's subscription and available plans
export async function GET() {
  try {
    const session = await checkRole(
      "USER",
      "You are not authorized for this action"
    );

    // Get the user with their plan information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all available plans
    const plans = await prisma.plan.findMany();

    // Get count of lifetime plan users
    const lifetimePlanUsers = await prisma.user.count({
      where: {
        plan: {
          name: "Lifetime Plan",
        },
      },
    });

    // Check if user has an active subscription
    const hasActiveSubscription =
      user.planId &&
      (user.planEnd === null || new Date(user.planEnd) > new Date());

    return NextResponse.json({
      currentPlan: user.plan,
      planStart: user.planStart,
      planEnd: user.planEnd,
      hasActiveSubscription,
      plans,
      lifetimePlanUsers,
      limitedOfferAvailable: lifetimePlanUsers < 10,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST: Create or update a subscription
export async function POST(req: NextRequest) {
  try {
    const session = await checkRole(
      "USER",
      "You are not authorized for this action"
    );

    // Parse and validate the request body
    const body = await req.json();
    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { planId } = result.data;
    
    // Note: Payment verification is now handled by the PayPal verify endpoint
    // When this endpoint is called, we assume the payment has been verified
    // in the client-side via the PayPal verify endpoint
    
    // Get the user with their current plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle different plan types
    let planName;
    let price;
    let durationDays;
    let proratedPrice = null;

    switch (planId) {
      case "monthly":
        planName = "Monthly Plan";
        price = "29";
        durationDays = 30;

        // Prevent downgrade from higher plans
        if (
          user.plan &&
          (user.plan.name === "Yearly Plan" ||
            user.plan.name === "Lifetime Plan")
        ) {
          return NextResponse.json(
            { error: "Cannot downgrade from a higher tier plan" },
            { status: 400 }
          );
        }
        break;

      case "yearly":
        planName = "Yearly Plan";
        price = "299";
        durationDays = 365;

        // Prevent downgrade from lifetime plan
        if (user.plan && user.plan.name === "Lifetime Plan") {
          return NextResponse.json(
            { error: "Cannot downgrade from a Lifetime plan" },
            { status: 400 }
          );
        }

        // Calculate prorated price if upgrading from monthly
        if (user.plan && user.plan.name === "Monthly Plan" && user.planStart) {
          const currentPlan = {
            price: user.plan.price,
            durationDays: user.plan.durationDays,
          };
          const newPlan = { price, durationDays };
          proratedPrice = calculateProratedPrice(
            currentPlan,
            newPlan,
            new Date(user.planStart)
          );
          price = proratedPrice.toFixed(2);
        }
        break;

      case "lifetime":
        planName = "Lifetime Plan";
        price = "2999";
        durationDays = null;

        // Calculate prorated price if upgrading from another plan
        if (user.plan && user.planStart) {
          const currentPlan = {
            price: user.plan.price,
            durationDays: user.plan.durationDays,
          };
          const newPlan = { price, durationDays };
          proratedPrice = calculateProratedPrice(
            currentPlan,
            newPlan,
            new Date(user.planStart)
          );
          price = proratedPrice.toFixed(2);
        }
        break;

      case "lifetime-limited":
        // Check if limited offer is still available
        const lifetimePlanUsers = await prisma.user.count({
          where: {
            plan: {
              name: "Lifetime Plan",
            },
          },
        });

        if (lifetimePlanUsers >= 10) {
          return NextResponse.json(
            { error: "Limited offer is no longer available" },
            { status: 400 }
          );
        }

        planName = "Lifetime Plan";
        price = "499";
        durationDays = null;

        // Calculate prorated price if upgrading from another plan
        if (user.plan && user.planStart) {
          const currentPlan = {
            price: user.plan.price,
            durationDays: user.plan.durationDays,
          };
          const newPlan = { price, durationDays };
          proratedPrice = calculateProratedPrice(
            currentPlan,
            newPlan,
            new Date(user.planStart)
          );
          price = proratedPrice.toFixed(2);
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid plan selected" },
          { status: 400 }
        );
    }

    // Get or create the plan
    const plan = await prisma.plan.upsert({
      where: { name: planName },
      update: {},
      create: {
        name: planName,
        price,
        jpMultiplier: 1.5,
        discountPercent: planName === "Yearly Plan" ? 20.0 : 0,
        durationDays,
      },
    });

    // Calculate plan end date based on duration
    const now = new Date();
    const planEnd = durationDays
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        planId: plan.id,
        planStart: now,
        planEnd,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: updatedUser.plan,
        planStart: updatedUser.planStart,
        planEnd: updatedUser.planEnd,
        proratedPrice: proratedPrice !== null ? proratedPrice : null,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
