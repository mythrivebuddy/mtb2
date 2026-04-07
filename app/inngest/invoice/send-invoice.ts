import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePDF";
import { sendInvoiceEmail } from "@/utils/sendEmail";
import { generateInvoiceNumber, getBillingInfo } from "@/lib/invoice/invoice";

import { PaymentStatus } from "@prisma/client";

export const sendInvoiceFunction = inngest.createFunction(
  {
    id: "send-invoice",
    retries: 3,
  },
  { event: "invoice/send" },

  async ({ event, step }) => {
    const { orderId } = event.data as { orderId: string };

    /**
     * 1️⃣ Fetch Order
     */
    const order = await step.run("fetch-order", async () => {
      return prisma.paymentOrder.findUnique({
        where: { id: orderId },
        include: {
          user: true,
        },
      });
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== PaymentStatus.PAID) {
      throw new Error("Order not paid yet");
    }
    if (order.contextType === "STORE_PRODUCT") {
      console.log("Skipping invoice for store order for now :", order.id);
      return { skipped: true, reason: "store_order" };
    }

    const purchaseData = await step.run("resolve-purchase", async () => {
      switch (order.contextType) {
        case "CHALLENGE":
          if (!order.challengeId) return null;

          const challenge = await prisma.challenge.findUnique({
            where: { id: order.challengeId },
            select: { title: true },
          });

          return {
            type: "challenge",
            name: challenge?.title || "MTB Challenge",
            items: [
              {
                name: challenge?.title || "MTB Challenge",
                quantity: 1,
                price: order.baseAmount,
              },
            ],
          };

        case "MMP_PROGRAM":
          if (!order.programId) return null;

          const program = await prisma.program.findUnique({
            where: { id: order.programId },
            select: { name: true },
          });

          return {
            type: "mmp",
            name: program?.name || "Mini Mastery Program",
            items: [
              {
                name: program?.name || "Mini Mastery Program",
                quantity: 1,
                price: order.baseAmount,
              },
            ],
          };

        case "STORE_PRODUCT":
          if (!order.storeOrderId) return null;

          const storeOrder = await prisma.order.findUnique({
            where: { id: order.storeOrderId },
            include: {
              items: {
                include: {
                  item: true, // 👈 VERY IMPORTANT
                },
              },
            },
          });

          const items =
            storeOrder?.items.map((oi) => ({
              name: oi.item.name,
              quantity: oi.quantity,
              price: oi.priceAtPurchase,
            })) || [];

          return {
            type: "store",
            name: "Store Purchase",
            items,
          };

        default:
          return {
            type: "unknown",
            name: "MTB Program",
            items: [
              {
                name: "MTB Program",
                quantity: 1,
                price: order.baseAmount,
              },
            ],
          };
      }
    });
    /**
     * 2️⃣ Fetch Billing
     */
    const billing = await step.run("fetch-billing", async () => {
      return getBillingInfo(order.userId);
    });

    /**
     * 3️⃣ Fetch Business Profile
     */
    const business = await step.run("fetch-business", async () => {
      return prisma.mtbBusinessProfile.findFirst();
    });

    if (!business) {
      throw new Error("Business profile missing");
    }

    /**
     * 4️⃣ Generate Invoice Number
     */
    const invoiceNumber = await step.run("invoice-number", async () => {
      return generateInvoiceNumber();
    });

    /**
     * 5️⃣ Generate PDF + Send Email
     */
    await step.run("send-email", async () => {
      const pdfUint8 = await generateInvoicePdf({
        order: {
          id: order.id,
          baseAmount: order.baseAmount,
          discountApplied: order.discountApplied,
          gstAmount: order.gstAmount,
          totalAmount: order.totalAmount,

          currency:
            order.currency === "INR" || order.currency === "USD"
              ? order.currency
              : "INR",

          purchaseData,
        },
        business: {
          companyName: business.companyName,
          gstNumber: business.gstNumber,
          address: business.address,
          logoUrl: business.logoUrl,
          lutNumber: business.lutNumber,
        },
        billing,
        invoiceNumber,
      });

      // Convert Uint8Array -> Buffer (required for email attachment)
      const pdfBuffer = Buffer.from(pdfUint8);

      return sendInvoiceEmail({
        to: billing.email || order.user.email,
        pdfBuffer,
        order,
        invoiceNumber,
      });
    });

    return { success: true };
  },
);
