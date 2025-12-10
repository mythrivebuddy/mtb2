import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SubscriptionStatus } from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { baseUrl, appId, secret } = await getCashfreeConfig();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    if (!subscription || !subscription.mandateId) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }
    const mandate = await prisma.mandate.findFirst({
      where: { id: subscription.mandateId }
    })
    if (!mandate) {
      return NextResponse.json(
        { message: "Mandate not found" },
        { status: 404 }
      )
    }
    // This is actually the Cashfree subscription_id you generated
    const subscriptionId = mandate.mandateId;


    if (!subscriptionId) {
      return NextResponse.json(
        { message: "Subscription ID missing" },
        { status: 500 }
      );
    }

    const cancelUrl = `${baseUrl}/subscriptions/${subscriptionId}/manage`;

    const cfResponse = await axios.post(
      cancelUrl,
      {
        subscription_id: subscriptionId,
        action: "CANCEL"
      },
      {
        headers: {
          "x-client-id": appId,
          "x-client-secret": secret,
          "x-api-version": "2022-09-01"
        }
      }
    );

    if (cfResponse.status < 200 || cfResponse.status >= 300) {
      return NextResponse.json(
        {
          message: "Failed to cancel Cashfree subscription.",
          errorDetails: cfResponse.data
        },
        { status: 500 }
      );
    }


    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELLATION_PENDING }
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully."
    });

  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("Cancel Error:", err.response?.data || err.message);
      return NextResponse.json(
        {
          message: "Failed to cancel Cashfree subscription.",
          errorDetails: err.response?.data || err.message
        },
        { status: 500 }
      );
    }

    if (err instanceof Error) {
      console.error("Cancel Error:", err.message);
      return NextResponse.json(
        {
          message: "Failed to cancel Cashfree subscription.",
          errorDetails: err.message
        },
        { status: 500 }
      );
    }

    console.error("Unknown error:", err);

    return NextResponse.json(
      {
        message: "Failed to cancel Cashfree subscription.",
        errorDetails: "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
