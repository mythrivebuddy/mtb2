import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Replace with your actual webhook secret from the PayPal dashboard
const PAYPAL_WEBHOOK_ID = process.env.PP_WEBHOOK_ID!;
const PAYPAL_ENV =
  process.env.NODE_ENV === "production"
    ? "api-m.paypal.com"
    : "api-m.sandbox.paypal.com";

// Utility to verify PayPal webhook signature
async function verifyWebhook(req: NextRequest, body: string) {
  const transmissionId = req.headers.get("paypal-transmission-id")!;
  const timestamp = req.headers.get("paypal-transmission-time")!;
  const webhookEventBody = body;
  const certUrl = req.headers.get("paypal-cert-url")!;
  const actualSig = req.headers.get("paypal-transmission-sig")!;
  const authAlgo = req.headers.get("paypal-auth-algo")!;
  const webhookId = PAYPAL_WEBHOOK_ID;

  // Call PayPal verify endpoint
  const res = await fetch(
    `https://${PAYPAL_ENV}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.PP_CLIENT_ID}:${process.env.PP_SECRET_KEY}`).toString("base64")}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: timestamp,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: actualSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(webhookEventBody),
      }),
    }
  );
  const verification = await res.json();
  return verification.verification_status === "SUCCESS";
}

// export async function POST(req: NextRequest) {
//   // 1. Read raw body for signature verification
//   const body = await req.text();

//   // 2. Verify signature
//   const isValid = await verifyWebhook(req, body);
//   if (!isValid) {
//     return NextResponse.json(
//       { error: "Invalid webhook signature" },
//       { status: 400 }
//     );
//   }

//   // 3. Parse event
//   const event = JSON.parse(body);
//   const { event_type, resource } = event;

//   // 4. Handle events
//   switch (event_type) {
//     case "BILLING.SUBSCRIPTION.CREATED":
//     case "BILLING.SUBSCRIPTION.ACTIVATED":
//       await prisma.user.update({
//         where: { subscriptionId: resource.id },
//         data: { subscriptionStatus: "ACTIVE" },
//       });
//       break;

//     case "BILLING.SUBSCRIPTION.CANCELLED":
//     case "BILLING.SUBSCRIPTION.SUSPENDED":
//       await prisma.user.update({
//         where: { subscriptionId: resource.id },
//         data: {
//           subscriptionStatus:
//             event_type === "CANCELLED" ? "CANCELLED" : "SUSPENDED",
//         },
//       });
//       break;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const isValid = await verifyWebhook(req, body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const { event_type, resource } = event;

  switch (event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const paypalPlanId = resource.plan_id;
      const userSubscriptionId = resource.id;

      if (!paypalPlanId) {
        console.error("❌ Webhook Error: No plan_id found in subscription resource.");
        break; // Exit without crashing
      }

      // 1. Find your internal plan using the PayPal ID
      const plan = await prisma.plan.findUnique({
        where: { paypalPlanId: paypalPlanId },
      });

      if (!plan) {
        console.error(`❌ Webhook Error: Plan with paypalPlanId ${paypalPlanId} not found in DB.`);
        break;
      }

      // 2. Update the user record with all necessary fields
      await prisma.user.update({
        where: { subscriptionId: userSubscriptionId },
        data: {
          membership: "PREMIUM", // Or a more descriptive name
          subscriptionStatus: "ACTIVE",
          planId: plan.id, // Link to your internal plan
          challenge_limit: 5, // << SET THE PAID USER LIMIT HERE
        },
      });

      console.log(`✅ User with subscription ${userSubscriptionId} upgraded to ${plan.name}. Challenge limit set to 5.`);
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      await prisma.user.update({
        where: { subscriptionId: resource.id },
        data: {
          membership: "FREE", // Revert user back to FREE
          subscriptionStatus: event_type === "BILLING.SUBSCRIPTION.CANCELLED" ? "CANCELLED" : "SUSPENDED",
          planId: null, // Disconnect the plan
          challenge_limit: 1, // << RESET THE LIMIT TO THE DEFAULT
        },
      });
      console.log(`ℹ️ User with subscription ${resource.id} status updated. Membership reverted to FREE and challenge limit set to 1.`);
      break;
    }


    case "PAYMENT.SALE.COMPLETED":
      // resource.billing_agreement_id holds the subscriptionId
      await prisma.invoice.create({
        data: {
          user: { connect: { subscriptionId: resource.billing_agreement_id } },
          amount: parseFloat(resource.amount.total),
          saleId: resource.id,
        },
      });
      break;

    // add more as needed…
    default:
      // ignore other events
      break;
  }

  // 5. Acknowledge receipt
  return NextResponse.json({ received: true });
}
