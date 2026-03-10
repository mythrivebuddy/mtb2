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

    /* -------------------------------- */
    /* 1️⃣ VALIDATE PARAMS               */
    /* -------------------------------- */

    if (!paymentId || !orderId || !signature) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/membership/failure?reason=missing_params",
          req.url
        )
      );
    }

    /* -------------------------------- */
    /* 2️⃣ VERIFY RAZORPAY SIGNATURE     */
    /* -------------------------------- */

    const { razorpayKeySecret } = await getRazorpayConfig();

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/membership/failure?reason=invalid_signature",
          req.url
        )
      );
    }

    /* -------------------------------- */
    /* 3️⃣ FIND PAYMENT ORDER            */
    /* -------------------------------- */

    const order = await prisma.paymentOrder.findFirst({
      where: {
        razorpayOrderId: orderId,
      },
    });

    if (!order) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/membership/failure?reason=order_not_found",
          req.url
        )
      );
    }

    /* -------------------------------- */
    /* 4️⃣ REDIRECT BASED ON CONTEXT     */
    /* -------------------------------- */

    switch (order.contextType) {

      /* ---------- CHALLENGE ---------- */

      case "CHALLENGE":
        if (!order.challengeId) {
          return NextResponse.redirect(
            new URL(
              `/dashboard/membership/failure?type=${order.contextType}&reason=challenge_missing`,
              req.url
            )
          );
        }

        return NextResponse.redirect(
          new URL(
            `/dashboard/challenge/upcoming-challenges/${order.challengeId}?orderId=${orderId}`,
            req.url
          )
        );

      /* ---------- MMP PROGRAM ---------- */

      case "MMP_PROGRAM":
        if (!order.programId) {
          return NextResponse.redirect(
            new URL(
              `/dashboard/membership/failure?type=${order.contextType}&reason=program_missing`,
              req.url
            )
          );
        }

        return NextResponse.redirect(
          new URL(
            `/dashboard/mini-mastery-programs/program/${order.programId}?payment=success&orderId=${orderId}`,
            req.url
          )
        );

      /* ---------- STORE PRODUCT ---------- */

      case "STORE_PRODUCT":
        if (!order.storeOrderId) {
          return NextResponse.redirect(
            new URL(
              "/dashboard/membership/failure?reason=store_order_missing",
              req.url
            )
          );
        }

        return NextResponse.redirect(
          new URL(
            `/dashboard/store/orders/${order.storeOrderId}?payment=success`,
            req.url
          )
        );

      /* ---------- SUBSCRIPTION ---------- */

      case "SUBSCRIPTION":
        return NextResponse.redirect(
          new URL(
            `/dashboard/membership/success?orderId=${orderId}`,
            req.url
          )
        );

      /* ---------- UNKNOWN ---------- */

      default:
        return NextResponse.redirect(
          new URL(
            "/dashboard/membership/failure?reason=unknown_context",
            req.url
          )
        );
    }

  } catch (error) {
    console.error("Razorpay Callback Error:", error);

    return NextResponse.redirect(
      new URL(
        "/dashboard/membership/failure?reason=server_error",
        req.url
      )
    );
  }
}