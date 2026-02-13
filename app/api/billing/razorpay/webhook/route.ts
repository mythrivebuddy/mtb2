import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { verifyRazorpaySignature } from "@/lib/razorpay/razorpay";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(
  body,
  signature,
  process.env.RAZORPAY_WEBHOOK_SECRET!
);

if (!isValid) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}

    const event = JSON.parse(body);

    // 2️⃣ Handle events
    switch (event.event) {

      /**
       * 🔵 ONE-TIME PAYMENT (LIFETIME)
       */
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        await prisma.paymentOrder.updateMany({
          where: {
            razorpayOrderId: orderId,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.SUCCESS,
            paymentGatewayPaymentId: payment.id,
          },
        });
        break;
      }

      /**
       * 🔁 AUTOPAY SUBSCRIPTION ACTIVATED
       */
      case "subscription.activated": {
        const subscription = event.payload.subscription.entity;

        await prisma.paymentOrder.updateMany({
          where: {
            razorpaySubscriptionId: subscription.id,
          },
          data: {
            status: PaymentStatus.SUCCESS,
          },
        });
        break;
      }

      /**
       * 🔁 RECURRING CHARGE SUCCESS
       */
      case "subscription.charged": {
        const payment = event.payload.payment.entity;

        // Optional: store charge history
        console.log("Subscription charged:", payment.id);
        break;
      }

      /**
       * ❌ PAYMENT FAILED
       */
      case "subscription.cancelled": {
  const subscription = event.payload.subscription.entity;

  await prisma.paymentOrder.updateMany({
    where: {
      razorpaySubscriptionId: subscription.id,
    },
    data: {
      status: PaymentStatus.FAILED,
    },
  });
  break;
}


      default:
        console.log("Unhandled Razorpay event:", event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
};
