// /api/billing/webhook/cashfree-programs/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  PlanInterval,
  PlanUserType,
  Prisma,
  SubscriptionStatus
} from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { verifySignature } from "@/lib/payment/payment.utils";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type CashfreeWebhookPayload = {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      cf_order_id?: string;
      order_status?: string;
    };
  };
};

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function extractPurchaseId(orderId?: string): string | null {
  // Expected format: prog_<purchaseId>_<timestamp>
  if (!orderId) return null;
  if (!orderId.startsWith("prog_")) return null;

  const parts = orderId.split("_");
  return parts.length >= 3 ? parts[1] : null;
}

function isPaymentSuccessEvent(type?: string): boolean {
  if (!type) return false;

  const normalized = type.toUpperCase();

  return (
    normalized.includes("SUCCESS") ||
    normalized.includes("PAID") ||
    normalized.includes("CAPTURED") ||
    normalized.includes("COMPLETED")
  );
}

function isPaymentFailureEvent(type?: string): boolean {
  if (!type) return false;

  const normalized = type.toUpperCase();

  return (
    normalized.includes("FAILED") ||
    normalized.includes("CANCELLED")
  );
}

/* ------------------------------------------------------------------ */
/* Core Business Logic */
/* ------------------------------------------------------------------ */


async function grantProgramAccess(
  purchaseId: string,
  orderId?: string
) {

  const purchase = await prisma.oneTimeProgramPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      plan: true,
      user: true
    }
  });

  if (!purchase) {
    console.error("❌ Purchase not found:", purchaseId);
    return;
  }

  // Fast idempotency guard (non-transactional, best effort)
  if (purchase.freeSubscriptionId) {
    return;
  }

  // Resolve effective userType
  const planUserType = purchase.plan.userType;
  const userUserType = purchase.user.userType;

  let effectiveUserType: PlanUserType | undefined;

  if (planUserType && planUserType !== "ALL") {
    effectiveUserType = planUserType;
  } else if (userUserType) {
    effectiveUserType = userUserType;
  }

  if (!effectiveUserType) {
    console.error("❌ Unable to resolve effective userType", {
      planUserType,
      userUserType
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    /**
     * 1️⃣ Ensure purchase is PAID
     * Safe to run multiple times
     */
    if (purchase.status !== PaymentStatus.PAID) {
      await tx.oneTimeProgramPurchase.update({
        where: { id: purchaseId },
        data: {
          status: PaymentStatus.PAID,
          orderId: orderId
        }
      });
    }

    /**
     * 2️⃣ Find yearly plan
     */
    const yearlyPlan = await tx.subscriptionPlan.findFirst({
      where: {
        interval: PlanInterval.YEARLY,
        userType: effectiveUserType,
        isActive: true
      }
    });

    if (!yearlyPlan) {
      console.error(
        "❌ No YEARLY plan found for userType:",
        effectiveUserType
      );
      return;
    }

    /**
     * 3️⃣ Create subscription
     * DB uniqueness is the final authority
     */
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setHours(23, 59, 59, 999);

    try {
      const subscription = await tx.subscription.create({
        data: {
          userId: purchase.userId,
          planId: yearlyPlan.id,
          status: SubscriptionStatus.FREE_GRANT,
          startDate,
          endDate,
          grantedByPurchaseId: purchase.id,
          orderId: orderId,
          couponId: purchase.couponId,
        }
      });

      if (purchase.couponId) {
        await tx.couponRedemption.create({
          data: {
            couponId: purchase.couponId,
            userId: purchase.userId,
            appliedPlan: yearlyPlan.id,
            discountApplied: purchase.discountApplied
          }
        });
      }

      /**
       * 4️⃣ Link purchase → subscription
       * Runs ONLY for the first successful webhook
       */
      await tx.oneTimeProgramPurchase.update({
        where: { id: purchaseId },
        data: { freeSubscriptionId: subscription.id }
      });

      /**
       * 5️⃣ Upgrade user membership
       */
      await tx.user.update({
        where: { id: purchase.userId },
        data: {
           membership: "PAID",
           currentPlanId: yearlyPlan.id,
           currentPlanInterval: PlanInterval.YEARLY,
           planStart: startDate,
           planEnd:endDate,
        }
      });

    } catch (err: unknown) {
      /**
       * Duplicate webhook → unique constraint hit
       * MUST exit transaction immediately
       */
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return;
      }

      throw err;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Webhook Handler */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const rawBody = await req.text();
  const { secret } = await getCashfreeConfig();

  if (!verifySignature(req, rawBody, secret)) {
    return NextResponse.json({ ok: true });
  }

  const body = JSON.parse(rawBody) as CashfreeWebhookPayload;
  const orderId = body.data?.order?.order_id;
  const purchaseId = extractPurchaseId(orderId);

  // ACK IMMEDIATELY (Vercel-safe)
  const response = NextResponse.json({ ok: true });

  if (purchaseId && isPaymentSuccessEvent(body.type)) {
    // fire-and-forget (DO NOT await)
    setImmediate(() => {
      grantProgramAccess(purchaseId, orderId).catch(console.error);
    });
  }

  if (purchaseId && isPaymentFailureEvent(body.type)) {
    setImmediate(() => {
      prisma.oneTimeProgramPurchase.updateMany({
        where: {
          id: purchaseId,
          status: { not: PaymentStatus.PAID }
        },
        data: { status: PaymentStatus.FAILED }
      }).catch(console.error);
    });
  }

  return response;
}