import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePDF";
import { sendInvoiceEmail } from "@/utils/sendEmail";
import { generateInvoiceNumber, getBillingInfo } from "@/lib/invoice/invoice";

import { PaymentStatus } from "@prisma/client";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseClient } from "@/lib/supabaseClient";
type StoreItem = {
  name: string;
  quantity: number;
  price: number;
};

type CartSnapshotItem = {
  itemId: string;
  discount?: number;
  price?: number;
  quantity?: number;
};

type StorePurchaseData = {
  type: "store";
  name: string;

  // ✅ ALL items (email)
  items: StoreItem[];

  // ✅ ADMIN items (invoice)
  invoiceItems: StoreItem[];

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
              role: true,
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
          const isGP = order.currency === "GP";

          const invoiceItemsRaw = isGP ? [] : storeOrder?.items || [];

          const subtotal = invoiceItemsRaw.reduce(
            (sum, item) =>
              sum +
              (item.originalPrice ?? item.priceAtPurchase) * item.quantity,
            0,
          );

          const cart: CartSnapshotItem[] =
            typeof order.cartSnapshot === "string"
              ? JSON.parse(order.cartSnapshot)
              : order.cartSnapshot || [];

          const discount = isGP
            ? 0
            : cart
                .filter((c) =>
                  invoiceItemsRaw.some((i) => i.itemId === c.itemId),
                )
                .reduce((sum, item) => sum + (item.discount || 0), 0);
          const taxable = subtotal - discount;
          const GST_RATE = 18;

          const gst = Number(((taxable * GST_RATE) / 100).toFixed(2));
          const total = taxable + gst;

          const allItems =
            storeOrder?.items.map((oi) => ({
              name: oi.item.name,
              quantity: oi.quantity,
              price: oi.priceAtPurchase,
            })) || [];

          const invoiceItems: StoreItem[] = invoiceItemsRaw.map((oi) => ({
            name: oi.item.name,
            quantity: oi.quantity,
            price: oi.originalPrice ?? oi.priceAtPurchase,
          }));

          // console.log("🧾 STORE INVOICE DEBUG");
          // console.log("Currency:", order.currency);
          // console.log("Total Store Items:", storeOrder?.items.length);
          // console.log("Invoice Items Count:", invoiceItems.length);
          // console.log("Subtotal:", subtotal);
          // console.log("Discount:", discount);
          // console.log("GST:", gst);
          // console.log("Total:", total);

          return {
            type: "store",
            name: "Store Purchase",

            // ✅ EMAIL WILL USE THIS
            items: allItems,

            // ✅ INVOICE WILL USE THIS
            invoiceItems,

            pricing: {
              baseAmount: subtotal,
              discount,
              taxable,
              gst,
              total,
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

    let baseAmount = order.baseAmount;
    let discount = order.discountApplied;
    let gstAmount: number | undefined = order.gstAmount;
    let totalAmount: number | undefined = order.totalAmount;

    if (purchaseData?.type === "store") {
      const storeData = purchaseData as StorePurchaseData;

      baseAmount = storeData.pricing.baseAmount;
      discount = storeData.pricing.discount;

      gstAmount = storeData.pricing.gst;
      totalAmount = storeData.pricing.total;
    }
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
      const existing = await prisma.invoice.findUnique({
        where: { paymentOrderId: order.id },
      });

      if (existing) return existing.invoiceNumber; // ✅ reuse

      return generateInvoiceNumber(); // ✅ only first time
    });
    const pdfBuffer = await step.run("generate-pdf", async () => {
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
                  items: (purchaseData as StorePurchaseData).invoiceItems,
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

      return Buffer.from(pdfUint8);
    });
    const pdfUrl = await step.run("upload-pdf", async () => {
      const folder = order.contextType?.toLowerCase() || "general";
      const filePath = `invoices/${folder}/invoice-${invoiceNumber}.pdf`;

      const buffer = Buffer.from(pdfBuffer.data); // ✅ reconstruct buffer

      const { data: existingFile } = await supabaseAdmin.storage
        .from("invoices")
        .list(`invoices/${folder}`, {
          search: `invoice-${invoiceNumber}.pdf`,
        });

      if (!existingFile || existingFile.length === 0) {
        const { error } = await supabaseAdmin.storage
          .from("invoices")
          .upload(filePath, buffer, {
            contentType: "application/pdf",
          });

        if (error) throw new Error(error.message);
      }

      const { data } = supabaseClient.storage
        .from("invoices")
        .getPublicUrl(filePath);

      return data.publicUrl;
    });

    await step.run("store-invoice", async () => {
      return prisma.invoice.upsert({
        where: {
          paymentOrderId: order.id,
        },
        update: {}, // do nothing if already exists
        create: {
          userId: order.userId,
          paymentOrderId: order.id,

          contextType: order.contextType!,
          referenceId:
            order.challengeId || order.programId || order.storeOrderId,

          baseAmount,
          discount,
          gstAmount: gstAmount || 0,
          totalAmount: totalAmount || baseAmount,
          currency: order.currency === "USD" ? "USD" : "INR",

          invoiceNumber,

          items: purchaseData ?? {},
          billing,
          business,

          pdfUrl,
        },
      });
    });

    await step.sleep("delay-email", "5h");
    /**
     * 5️⃣ Generate PDF + Send Email
     */
    await step.run("send-email", async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { paymentOrderId: order.id },
      });

      // ✅ Already sent → skip
      if (invoice?.emailSent) {
        return { skipped: true };
      }

      // ✅ Send email
      await sendInvoiceEmail({
        to: billing.email || order.user.email,
        pdfBuffer: Buffer.from(pdfBuffer.data),
        order,
        invoiceNumber,
        purchaseData,
        business,
      });

      // ✅ Mark as sent
      await prisma.invoice.update({
        where: { paymentOrderId: order.id },
        data: {
          emailSent: true,
        },
      });

      return { success: true };
    });

    return { success: true };
  },
);
