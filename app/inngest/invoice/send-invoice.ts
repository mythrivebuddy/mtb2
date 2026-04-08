import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePDF";
import { sendInvoiceEmail } from "@/utils/sendEmail";
import {
  generateInvoiceNumber,
  getBillingInfo,
  getGSTDetails,
} from "@/lib/invoice/invoice";

import { PaymentStatus } from "@prisma/client";
type StoreItem = {
  name: string;
  quantity: number;
  price: number;
};

type StorePurchaseData = {
  type: "store";
  name: string;

  // ✅ ALL items (email)
  items: StoreItem[];

  // ✅ ADMIN items (invoice)
  adminItems: StoreItem[];

  pricing: {
    baseAmount: number;
    discount: number;
    taxable: number;
    gst: number;
    total: number;
  };
};

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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== PaymentStatus.PAID) {
      throw new Error("Order not paid yet");
    }

    const purchaseData = await step.run("resolve-purchase", async () => {
      switch (order.contextType) {
        case "CHALLENGE":
          if (!order.challengeId) return null;

          const challenge = await prisma.challenge.findUnique({
            where: { id: order.challengeId },
            select: { title: true, startDate: true },
          });

          return {
            type: "challenge",
            name: challenge?.title || "MTB Challenge",
            items: [
              {
                name: challenge?.title || "MTB Challenge",
                quantity: 1,
                price: order.baseAmount,
                startDate: challenge?.startDate,
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
                  item: {
                    include: {
                      creator: {
                        select: { role: true },
                      },
                    },
                  },
                },
              },
            },
          });
          const adminItemsRaw =
            storeOrder?.items.filter(
              (oi) => oi.item.creator?.role === "ADMIN",
            ) || [];
          const adminSubtotal = adminItemsRaw.reduce(
            (sum, item) =>
              sum +
              (item.originalPrice ?? item.priceAtPurchase) * item.quantity,
            0,
          );
          const totalOrderValue =
            storeOrder?.items.reduce(
              (sum, item) =>
                sum +
                (item.originalPrice ?? item.priceAtPurchase) * item.quantity,
              0,
            ) || 0;

          const cart =
            typeof order.cartSnapshot === "string"
              ? JSON.parse(order.cartSnapshot)
              : order.cartSnapshot || [];

          const adminDiscount = cart
            .filter((c: any) =>
              adminItemsRaw.some((ai) => ai.itemId === c.itemId),
            )
            .reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
          const adminTaxable = adminSubtotal - adminDiscount;
          const GST_RATE = 18; // or derive dynamically

          const adminGst = Number(((adminTaxable * GST_RATE) / 100).toFixed(2));
          const adminTotal = adminTaxable + adminGst;

          const allItems =
            storeOrder?.items.map((oi) => ({
              name: oi.item.name,
              quantity: oi.quantity,
              price: oi.priceAtPurchase,
            })) || [];

          const adminItems: StoreItem[] = adminItemsRaw.map((oi) => ({
            name: oi.item.name,
            quantity: oi.quantity,
            price: oi.originalPrice ?? oi.priceAtPurchase,
          }));

          return {
            type: "store",
            name: "Store Purchase",

            // ✅ EMAIL WILL USE THIS
            items: allItems,

            // ✅ INVOICE WILL USE THIS
            adminItems,

            pricing: {
              baseAmount: adminSubtotal,
              discount: adminDiscount,
              taxable: adminTaxable,
              gst: adminGst,
              total: adminTotal,
            },
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
      return getBillingInfo(order.userId, {
        preferLegacy: purchaseData?.type === "store",
      });
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
      let pricing;
      let baseAmount = order.baseAmount;
      let discount = order.discountApplied;
      let gstAmount: number | undefined = order.gstAmount;
      let totalAmount: number | undefined = order.totalAmount;

      if (purchaseData?.type === "store") {
        const storeData = purchaseData as StorePurchaseData;

        baseAmount = storeData.pricing.baseAmount;
        discount = storeData.pricing.discount;

        // ❌ IMPORTANT: do NOT pass gst/total
        gstAmount = storeData.pricing.gst;
        totalAmount = storeData.pricing.total;
      }

      const pdfUint8 = await generateInvoicePdf({
        order: {
          id: order.id,
          baseAmount,
          discountApplied: discount,
          gstAmount,
          totalAmount,
          currency:
            order.currency === "INR" || order.currency === "USD"
              ? order.currency
              : "INR",

          purchaseData:
            purchaseData?.type === "store"
              ? {
                  ...(purchaseData as StorePurchaseData),
                  items: (purchaseData as StorePurchaseData).adminItems,
                }
              : purchaseData,
        },
        business: {
          companyName: business.companyName,
          gstNumber: business.gstNumber,
          address: business.address,
          logoUrl: business.logoUrl,
          lutNumber: business.lutNumber,
          state: business.state,
          country: business.country,
          pincode: business.pincode || "",
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
        purchaseData,
        business,
      });
    });

    return { success: true };
  },
);
