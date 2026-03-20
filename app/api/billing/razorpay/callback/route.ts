// /api/billing/razorpay/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  const orderId =
    url.searchParams.get("order_id") ||
    url.searchParams.get("razorpay_order_id");

  const subId =
    url.searchParams.get("sub_id") ||
    url.searchParams.get("razorpay_subscription_id");

  const paymentId =
    url.searchParams.get("pay_id") ||
    url.searchParams.get("payment_id") ||
    url.searchParams.get("razorpay_payment_id");

  const signature =
    url.searchParams.get("signature") ||
    url.searchParams.get("razorpay_signature");

  /* -------------------------------------------------- */
  /* OPTIONAL SIGNATURE CHECK (DO NOT BLOCK) */
  /* -------------------------------------------------- */
  if (paymentId && signature) {
    try {
      const { razorpayKeySecret } = await getRazorpayConfig();

      const body = orderId
        ? `${orderId}|${paymentId}`
        : `${paymentId}|${subId}`;

      const expected = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        console.warn("⚠ Razorpay signature mismatch (ignored)");
      }
    } catch (err) {
      console.warn("⚠ Signature verification skipped", err);
    }
  }

  /* -------------------------------------------------- */
  /* 🔑 ONE DB QUERY → FETCH INTERNAL paymentOrder.id */
  /* -------------------------------------------------- */
  let pid: string | null = null;

  if (orderId || subId) {
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: orderId
        ? { razorpayOrderId: orderId }
        : { razorpaySubscriptionId: subId! },
      select: { id: true },
    });

    pid = paymentOrder?.id ?? null;
  }

  /* -------------------------------------------------- */
  /* REDIRECT TO SUCCESS PAGE */
  /* -------------------------------------------------- */
  const successUrl = new URL(`/dashboard/subscription`, baseUrl);

  successUrl.searchParams.set("type", "membership");

  if (pid) {
    successUrl.searchParams.set("pid", pid); // ✅ THIS FIXES 403
  }

  return NextResponse.redirect(successUrl);
}