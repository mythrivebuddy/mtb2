// app/api/billing/create-mandate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });
    }

    const subscriptionId = `sub_${Date.now()}_${userId}`;
    const firstChargeDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "+05:30");
    const sessionExpire = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "+05:30");

    const payload = {
      subscription_id: subscriptionId,
      customer_details: {
        customer_name: session.user.name ?? "User",
        customer_email: session.user.email!,
        customer_phone: "9999999999"  // ideally fetch real phone
      },
      plan_details: {
        plan_name: plan.name,
        plan_type: "PERIODIC",
        plan_amount: plan.amountINR,
        plan_max_amount: plan.amountINR,
        plan_max_cycles: 500,
        plan_intervals: 1,
        plan_currency: "INR",
        plan_interval_type: plan.interval === "MONTHLY" ? "MONTH" : "YEAR",
        plan_note: "Subscription"
      },
      authorization_details: {
        authorization_amount: plan.amountINR,
        authorization_amount_refund: true,
        payment_methods: ["upi", "card","enach"]
      },
      subscription_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/subscription-callback?sub_id=${subscriptionId}`,
        notification_channel: ["EMAIL"],
        session_id_expiry: sessionExpire
      },
      subscription_expiry_time: "2100-01-01T23:00:08+05:30",
      subscription_first_charge_time: firstChargeDate
    };

    const resp = await fetch(
      `${process.env.CASHFREE_BASE_URL}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_CLIENT_ID!,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
          "x-api-version": "2025-01-01"
        },
        body: JSON.stringify(payload)
      }
    );
    const data = await resp.json();
    if (!resp.ok) {
      console.error("Cashfree create subscription failed:", data);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    // Save to DB as pending mandate / subscription
    await prisma.mandate.create({
      data: {
        mandateId: subscriptionId,
        userId,
        planId,
        status: "PENDING",
        currency: "INR",
        frequency: plan.interval,
        maxAmount: plan.amountINR
      }
    });
    
    
    console.log({
        subscriptionId: data.subscription_id,
      subscriptionSessionId: data.subscription_session_id
    });
    console.log("Payment Session URL:", `${process.env.CASHFREE_BASE_URL}/subscription-sessions`);
    console.log({data});
    

    return NextResponse.json({
      subscriptionId: data.subscription_id,
      subscriptionSessionId: data.subscription_session_id,
      paymentSessionId: data.subscription_session_id
    });
  } catch (err) {
    console.error("Error in create-mandate:", err);
    return NextResponse.json({ error: "Mandate creation failed" }, { status: 500 });
  }
}
