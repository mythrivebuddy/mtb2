import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
import { PaymentStatus } from "@prisma/client";
import { processPayment } from "@/lib/payment/processPayment";
import { inngest } from "@/lib/inngest";

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

    const event = JSON.parse(rawBody);

    if (event.event !== "payment.captured") {
      return new NextResponse("Event ignored", { status: 200 });
    }

    const payment = event.payload?.payment?.entity;

    if (!payment) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    const existingOrder = await prisma.paymentOrder.findFirst({
      where: { razorpayOrderId },
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 200 });
    }

    if (existingOrder.status === PaymentStatus.PAID) {
      return new NextResponse("Already processed", { status: 200 });
    }
    let paymentMeta: {
      isAdmin?: boolean;
      adminItemIds?: string[];
    } = {};

    await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.paymentOrder.update({
        where: { id: existingOrder.id },
        data: {
          status: PaymentStatus.PAID,
          paymentId,
          paidAt: new Date(),
        },
      });

      paymentMeta = await processPayment(tx, updatedOrder);
      console.log("=== PAYMENT META DEBUG ===");
      console.log("Order ID:", existingOrder.id);
      console.log("Context Type:", existingOrder.contextType);
      console.log("isAdmin:", paymentMeta.isAdmin);
      console.log("adminItemIds:", paymentMeta.adminItemIds);
      console.log("================================");
    });
    try {
      if (inngest && typeof inngest.send === "function") {
        // 🟢 STORE → partial invoice
        if (paymentMeta.adminItemIds && paymentMeta.adminItemIds.length > 0) {
          console.log("📦 STORE INVOICE (PARTIAL)");
          console.log("Admin Item IDs:", paymentMeta.adminItemIds);

          await inngest.send({
            name: "invoice/send",
            id: `invoice-${payment.id}`,
            data: {
              orderId: existingOrder.id,
              itemIds: paymentMeta.adminItemIds,
            },
          });
        } else if (paymentMeta.isAdmin) {
          console.log("🎯 FULL INVOICE (PROGRAM/CHALLENGE - ADMIN)");

          await inngest.send({
            name: "invoice/send",
            id: `invoice-${payment.id}`,
            data: {
              orderId: existingOrder.id,
            },
          });
        } else {
          console.log("❌ NO INVOICE TRIGGERED");
        }
      } else {
        console.warn("Inngest not configured, skipping event");
      }
    } catch (err) {
      console.error("Inngest failed (ignored):", err);
    }
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
