import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, planId } = await req.json();

    // Fetch plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    if (!plan)
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );

    const orderId = `lifetime_${Date.now()}_${userId}`;

    const payload = {
      order_id: orderId,
      order_amount: plan.amountINR,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_email: user.email
      },
      order_meta: {
        return_url: `${process.env.CASHFREE_RETURN_URL}?order_id=${orderId}`
      }
    };

    const resp = await axios.post(
      `${process.env.CASHFREE_BASE_URL}/orders`,
      payload,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID!,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json"
        }
      }
    );

    // Create lifetime subscription
    await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date("2099-12-31")
      }
    });

    return NextResponse.json({ order: resp.data });
  } catch (e: any) {
    console.error("LIFETIME ERROR:", e.response?.data || e);
    return NextResponse.json(
      { error: "Lifetime order failed" },
      { status: 500 }
    );
  }
}
