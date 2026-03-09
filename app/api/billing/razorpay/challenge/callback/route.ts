import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const paymentId = searchParams.get("payment_id");
    const orderId = searchParams.get("order_id");
    const signature = searchParams.get("signature");

    if (!paymentId || !orderId || !signature) {
      return NextResponse.redirect(
        new URL("/payment-failed?type=challenge&reason=missing_params", req.url)
      );
    }
    const { razorpayKeySecret } = await getRazorpayConfig();

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.redirect(
        new URL("/payment-failed?reason=invalid_signature", req.url)
      );
    }

    // Optional: check if order exists
    const order = await prisma.paymentOrder.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!order) {
      return NextResponse.redirect(
        new URL("/payment-failed?type=challenge&reason=order_not_found", req.url)
      );
    }


    // Do NOT mark success here — webhook will handle that

    return NextResponse.redirect(
      new URL(
        `/dashboard/challenge/upcoming-challenges/${order.challengeId}?orderId=${orderId}`,
        req.url
      )
    );
  } catch (error: unknown) {
    console.error("Challenge Callback Error:", error);

    return NextResponse.redirect(
      new URL("/dashboard/membership/failure?type=challenge&reason=server_error", req.url)
    );
  }
}