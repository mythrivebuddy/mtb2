import { CouponLike } from "@/types/client/subscription";
import { PaymentStatus, PlanInterval, SubscriptionStatus } from "@prisma/client";
import {prisma} from "@/lib/prisma";
import crypto from "crypto"
type CashfreeOrderResponse = {
  order_status?: string;
  order_status_description?: string;
  payment_message?: string;
  payment?: {
    graphical_status_message?: string;
    error_text?: string;
    bank_error_message?: string;
  };
};

type CashfreeSubscriptionResponse = {
  subscription_status?: string;
  subscription_status_description?: string;
  subscription_failure_reason?: string;
  last_payment?: {
    failure_reason?: string;
    payment_method?: string;
  };
};

// ==========================================================
// Extract failure message from ORDER (Lifetime Payment)
// ==========================================================
export function extractOrderFailureReason(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Payment failed";
  }

  const d = data as CashfreeOrderResponse;

  return (
    d.order_status_description ||
    d.payment_message ||
    d.payment?.graphical_status_message ||
    d.payment?.error_text ||
    d.payment?.bank_error_message ||
    d.order_status ||
    "Payment failed"
  );
}

// ==========================================================
// Extract failure message from SUBSCRIPTION / MANDATE
// ==========================================================
export function extractMandateFailureReason(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Mandate setup failed";
  }

  const d = data as CashfreeSubscriptionResponse;

  return (
    d.last_payment?.failure_reason ||
    d.subscription_failure_reason ||
    d.subscription_status_description ||
    d.subscription_status ||
    "Mandate setup failed"
  );
}


// --- Helper: Verify Signature (Only for Webhooks) ---
 export const verifySignature = (req: Request, rawBody: string,secret: string) => {
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");
  if (!timestamp || !signature) return false;
  const data = timestamp + rawBody;
  const genSignature = crypto.createHmac("sha256", secret).update(data).digest("base64");
  return genSignature === signature;
};

// helper to calculate discount 
export function calculateDiscount(baseAmount: number, coupon: CouponLike | null): number {
  if (!coupon) return 0;

  switch (coupon.type) {
    case "PERCENTAGE":
      return (baseAmount * (coupon.discountPercentage || 0)) / 100;

    case "FIXED":
      return coupon.discountAmount || 0;

    case "FREE_DURATION": // Treat free duration as 100% off for lifetime if applicable, or logic specific to you
    case "FULL_DISCOUNT":
      return baseAmount;

    default:
      return 0;
  }
}

// final amount after deducting the discount
export function calculateFinal(
  base: number,
  discount: number,
  isIndia: boolean,
  gstEnabled: boolean,
  gstRate: number
): number {
  let value = Math.max(0, base - discount);
  if (isIndia && gstEnabled) value += value * gstRate;
  return parseFloat(value.toFixed(2));
}


export function extractPurchaseId(orderId?: string): string | null {
  // Expected format: prog_<paymentOrderId>_<timestamp>
  if (!orderId) return null;
  if (!orderId.startsWith("prog_")) return null;

  const parts = orderId.split("_");
  return parts.length >= 3 ? parts[1] : null;
}

export function isPaymentSuccessEvent(type?: string): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return (
    t.includes("SUCCESS") ||
    t.includes("PAID") ||
    t.includes("CAPTURED") ||
    t.includes("COMPLETED")
  );
}

export function isPaymentFailureEvent(type?: string): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return t.includes("FAILED") || t.includes("CANCELLED");
}

/* ------------------------------------------------------------------ */
/* Core Logic */
/* ------------------------------------------------------------------ */

export async function handleSuccessfulPayment(
  paymentOrderId: string,
  orderId?: string
) {
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
    include: {
      plan: true,
      user: true
    }
  });

  if (!paymentOrder) {
    console.error("❌ PaymentOrder not found:", paymentOrderId);
    return;
  }
console.log("Success payment transaction begins");

  await prisma.$transaction(async (tx) => {
    /**
     * 1️⃣ Mark payment as PAID (idempotent)
     */
    if (paymentOrder.status !== PaymentStatus.PAID) {
      await tx.paymentOrder.update({
        where: { id: paymentOrderId },
        data: {
          status: PaymentStatus.PAID,
          orderId
        }
      });
    }

    /**
     * 2️⃣ Prevent duplicate subscriptions (webhook retries)
     */
    const existingSubscription = await tx.subscription.findFirst({
      where: { orderId }
    });

    if (existingSubscription) {
      return;
    }

    /**
     * 3️⃣ Resolve subscription dates based on plan interval
     */
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (paymentOrder.plan.interval) {
      case PlanInterval.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;

      case PlanInterval.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
        case PlanInterval.LIFETIME:
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
      default:
        throw new Error("Unsupported plan interval");
    }

    endDate.setHours(23, 59, 59, 999);

    /**
     * 4️⃣ Create subscription
     */
    await tx.subscription.create({
      data: {
        userId: paymentOrder.userId,
        planId: paymentOrder.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        orderId,
        paymentOrderId,
        couponId: paymentOrder.couponId
      }
    });

    /**
     * 5️⃣ Coupon redemption (optional)
     */
    if (paymentOrder.couponId) {
      await tx.couponRedemption.create({
        data: {
          couponId: paymentOrder.couponId,
          userId: paymentOrder.userId,
          appliedPlan: paymentOrder.planId,
          discountApplied: paymentOrder.discountApplied
        }
      });
    }

    /**
     * 6️⃣ Upgrade user membership
     */
    await tx.user.update({
      where: { id: paymentOrder.userId },
      data: {
        membership: "PAID",
        currentPlanId: paymentOrder.planId,
        currentPlanInterval: paymentOrder.plan.interval,
        planStart: startDate,
        planEnd: endDate
      }
    });
  });
}


export async function handleFailedPayment(paymentOrderId: string) {
  console.log("Failed payment transaction begins");
  await prisma.paymentOrder.updateMany({
    where: {
      id: paymentOrderId,
      status: { not: PaymentStatus.PAID }
    },
    data: {
      status: PaymentStatus.FAILED
    }
  });
}

