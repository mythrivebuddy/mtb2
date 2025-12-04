import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// --- Helper for Signature Verification ---
// You can move this to a separate utils file if you prefer
const verifySignature = (req: Request, rawBody: string) => {
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");
  
  if (!timestamp || !signature) return false;

  const secret = process.env.CASHFREE_CLIENT_SECRET!;
  const data = timestamp + rawBody;
  const genSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
    
  return genSignature === signature;
};

export async function POST(req: Request) {
  try {
    // 1. Get Raw Body for verification
    const rawBody = await req.text();
    
    // 2. Verify Signature (CRITICAL SECURITY STEP)
    const isValid = verifySignature(req, rawBody);
    if (!isValid) {
      console.error("Invalid Cashfree Signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const type = body.type; // e.g., "SUBSCRIPTION_STATUS_CHANGE"

    console.log("Cashfree Webhook Type:", type);

    // --- CASE 1: Initial Activation (or Status Change) ---
    if (type === "SUBSCRIPTION_STATUS_CHANGE") {
      const subData = body.data.subscription;
      const subId = subData.subscription_id;
      const status = subData.subscription_status;

      if (status === "ACTIVE") {
        await prisma.mandate.update({
          where: { mandateId: subId },
          data: { status: "ACTIVE" }
        });
        
        // Ensure a Subscription record exists for your app logic
        const mandate = await prisma.mandate.findUnique({ where: { mandateId: subId } });
        if (mandate) {
           // Create or Update your main Subscription table here if distinct from Mandate
           await prisma.subscription.upsert({
             where: { mandateId: mandate.id },
             create: {
               userId: mandate.userId,
               mandateId: mandate.id,
               status: "ACTIVE",
               planId: mandate.planId,
               startDate: new Date(),
               endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
             },
             update: { status: "ACTIVE" }
           });
        }
      }
    }

    // --- CASE 2: Recurring Payment Success ---
    // This event fires on every subsequent auto-debit
    if (type === "SUBSCRIPTION_PAYMENT" || type === "SUBSCRIPTION_NEW_PAYMENT") {
      const payment = body.data.payment; // check Cashfree docs for exact structure of your version
      const subId = body.data.subscription.subscription_id;
      
      if (payment.payment_status === "SUCCESS") {
        // 1. Find the mandate
        const mandate = await prisma.mandate.findUnique({
          where: { mandateId: subId }
        });

        if (mandate) {
          // 2. Find the linked subscription
          const subscription = await prisma.subscription.findFirst({
            where: { mandateId: mandate.id }
          });

          if (subscription) {
            // 3. Extend the subscription date
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                renewedAt: new Date(),
                // Extend by another 30 days (or based on plan interval)
                endDate: new Date(subscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000)
              }
            });

            // 4. Log the Invoice
            await prisma.subscriptionInvoice.create({
              data: {
                subscriptionId: subscription.id,
                userId: mandate.userId,
                planId: mandate.planId,
                baseAmount: payment.payment_amount,
                totalAmount: payment.payment_amount,
                currency: "INR",
                transactionId: payment.cf_payment_id, // Cashfree ID
                status: "PAID",
                billingDate: new Date()
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}