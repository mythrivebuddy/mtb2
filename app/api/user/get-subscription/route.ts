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

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "CANCELLATION_PENDING", "FREE_GRANT"],
        },
      },
      orderBy: {
        endDate: "desc",
      },
      include: {
        plan: true,
        mandate: true,
      },
    });

    const hasActiveSubscription = Boolean(subscription);

    let currentSubscriptionResponse = null;
    let grantedByProgram: null | {
      id: string;
      name: string;
    } = null;

    if (subscription) {
      const { mandate, plan, ...subDetails } = subscription;

      // 🔑 If this subscription was FREE_GRANT, fetch the source program
      if (
        subscription.status === "FREE_GRANT" &&
        subscription.grantedByPurchaseId
      ) {
        const purchase = await prisma.oneTimeProgramPurchase.findUnique({
          where: { id: subscription.grantedByPurchaseId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (purchase?.product) {
          grantedByProgram = purchase.product;
        }
      }

      currentSubscriptionResponse = {
        ...subDetails,
        plan,
        maxAmount: mandate?.maxAmount || null,
        frequency: mandate?.frequency || null,
        currency: mandate?.currency || null,
        paymentMethod: mandate?.paymentMethod || null,
      };
    }

    return NextResponse.json({
      message: "Subscription fetched",
      hasActiveSubscription,
      currentSubscription: currentSubscriptionResponse,
      currentPlan: subscription?.plan || null,
      grantedByProgram, // ✅ NEW
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
