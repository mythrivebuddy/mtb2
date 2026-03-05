import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
import { PaymentStatus } from "@prisma/client";


export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const { razorpayWebhookSecret } = await getRazorpayConfig();

    const expectedSignature = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: {
          entity: {
            id: string;
            order_id: string;
            status: string;
          };
        };
      };
    };

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment?.entity;

      if (!paymentEntity) {
        return new NextResponse("Invalid payload", { status: 400 });
      }

      const razorpayOrderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const existingOrder = await prisma.paymentOrder.findFirst({
        where: { razorpayOrderId },
      });

      if (!existingOrder) {
        return new NextResponse("Order not found", { status: 200 });
      }

      // Idempotency: if already SUCCESS, exit
      if (existingOrder.status === PaymentStatus.PAID) {
        return new NextResponse("Already processed", { status: 200 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.paymentOrder.update({
          where: { id: existingOrder.id },
          data: {
            status: PaymentStatus.PAID,
            paymentId,
            paidAt: new Date(),
          },
        });

      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: unknown) {
    console.error("Razorpay Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}