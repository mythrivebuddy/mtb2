import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const mandates = await prisma.mandate.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true, user: true }
    });

    const results = [];

    for (const m of mandates) {
      const chargeId = `charge_${Date.now()}_${m.id}`;

      const payload = {
        order_id: chargeId,
        order_amount: m.plan.amountINR,
        order_currency: "INR",
        customer_details: {
          customer_id: m.userId,
          customer_email: m.user.email
        },
        recurring_details: {
          mandate_id: m.mandateId
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

      const payment = resp.data;

      const subscription = await prisma.subscription.upsert({
        where: { mandateId: m.id },
        create: {
          userId: m.userId,
          planId: m.planId,
          mandateId: m.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 86400 * 1000)
        },
        update: {
          renewedAt: new Date(),
          endDate: new Date(Date.now() + 30 * 86400 * 1000)
        }
      });

      await prisma.subscriptionInvoice.create({
        data: {
          subscriptionId: subscription.id,
          userId: m.userId,
          planId: m.planId,
          baseAmount: m.plan.amountINR,
          gstAmount: 0,
          totalAmount: m.plan.amountINR,
          currency: "INR",
          transactionId: payment.order_id,
          status: "PAID",
          billingDate: new Date()
        }
      });

      results.push({
        mandateId: m.mandateId,
        charge: payment
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Recurring failed" }, { status: 500 });
  }
}
