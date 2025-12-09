// /api/user/get-subscription

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Calculate the current date at the start of the day for comparison
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Fetch the most relevant subscription that is either ACTIVE or PENDING CANCELLATION.
    // Ensure 'mandate' is included as it holds the payment details.
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "CANCELLATION_PENDING"],
        },
      },
      orderBy: {
        endDate: "desc",
      },
      include: {
        plan: true,
        mandate: true, // Mandate included here
      },
    });

    
    const hasActiveSubscription = Boolean(subscription);

    // --- Prepare the response data ---
    let currentSubscriptionResponse = null;

    if (subscription) {
      const { mandate, plan, ...subDetails } = subscription;
      
      // Merge Subscription details with Mandate details for the frontend
      // The frontend can now access these fields directly on 'currentSubscription'
      currentSubscriptionResponse = {
        ...subDetails,
        plan: plan, // Keep the plan nested
        // MANDATE DETAILS MAPPED TO SUBSCRIPTION OBJECT:
        maxAmount: mandate?.maxAmount || null, // maxAmount from mandate
        frequency: mandate?.frequency || null, // frequency from mandate
        currency: mandate?.currency || null,   // currency from mandate
        paymentMethod: mandate?.paymentMethod || null, // paymentMethod from mandate
      };
    }
    // --- End preparation ---

    return NextResponse.json({
      message: "Subscription fetched",
      hasActiveSubscription: hasActiveSubscription,
      currentSubscription: currentSubscriptionResponse, // Use the enriched object
      currentPlan: subscription?.plan || null,
      userType: session.user.userType,
      membership: session.user.membership,
    });
  } catch (err) {
    console.error("GET Subscription Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription", details: String(err) },
      { status: 500 }
    );
  }
}