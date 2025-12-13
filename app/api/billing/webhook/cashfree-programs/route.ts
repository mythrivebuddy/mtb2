import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, PlanUserType, SubscriptionStatus } from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { verifySignature } from "@/lib/payment/payment.utils";

// ----- Helper: Find 1-Year Plan Automatically -----
async function findGrantedPlan(userType: PlanUserType) {
  return prisma.subscriptionPlan.findFirst({
    where: {
      userType,
      interval: "YEARLY",
      isActive: true
    }
  });
}

// ----- Grant Free Subscription -----
async function grantProgramAccess(purchaseId: string, cashfreeOrderId: string) {
  const purchase = await prisma.oneTimeProgramPurchase.findUnique({
    where: { id: purchaseId },
    include: { plan: true }
  });

  if (!purchase || purchase.status === PaymentStatus.PAID) return;

  // 1. Update purchase to PAID
  await prisma.oneTimeProgramPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PaymentStatus.PAID,
      cashfreeOrderId
    }
  });

  // 2. Get correct granted plan by userType
  const grantedPlan = await findGrantedPlan(purchase.plan.userType);

  if (!grantedPlan) {
    console.error(`No yearly plan found for userType=${purchase.plan.userType}`);
    return;
  }

  // 3. Create subscription
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      userId: purchase.userId,
      planId: grantedPlan.id,
      status: SubscriptionStatus.FREE_GRANT,
      startDate: start,
      endDate: end,
      grantedByPurchaseId: purchase.id
    }
  });

  // 4. Link subscription
  await prisma.oneTimeProgramPurchase.update({
    where: { id: purchaseId },
    data: { freeSubscriptionId: subscription.id }
  });

  // 5. Update user membership
  await prisma.user.update({
    where: { id: purchase.userId },
    data: { membership: "PAID" }
  });
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const { secret } = await getCashfreeConfig();

    if (!verifySignature(req, raw, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const event = body.type;

    if (event === "ORDER_SUCCESS" || event === "PAYMENT_SUCCESS") {
      const order = body.data.order;
      const orderId = order.order_id;
      const cfId = order.cf_order_id;
      const internalId = orderId.split("_")[1];

      if (internalId) await grantProgramAccess(internalId, cfId);
    }

    if (event === "ORDER_FAILED" || event === "PAYMENT_FAILED") {
      const order = body.data.order;
      const orderId = order.order_id;
      const internalId = orderId.split("_")[1];

      if (internalId) {
        await prisma.oneTimeProgramPurchase.update({
          where: { id: internalId },
          data: { status: PaymentStatus.FAILED }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Program Webhook Error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
