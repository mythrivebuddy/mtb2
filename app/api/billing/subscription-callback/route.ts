// app/api/billing/subscription-callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// --- Helper: Verify Signature (Only for Webhooks) ---
const verifySignature = (req: Request, rawBody: string) => {
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");
  if (!timestamp || !signature) return false;
  const secret = process.env.CASHFREE_CLIENT_SECRET!;
  const data = timestamp + rawBody;
  const genSignature = crypto.createHmac("sha256", secret).update(data).digest("base64");
  return genSignature === signature;
};

// --- Helper: Activate Subscription Logic ---
async function activateSubscription(subscriptionId: string) {
  const mandate = await prisma.mandate.update({
    where: { mandateId: subscriptionId },
    data: { status: "ACTIVE" } // We assume success if we got here
  });

  const durationDays = mandate.frequency === "YEARLY" ? 365 : 30;
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { mandateId: mandate.id },
    create: {
      userId: mandate.userId,
      mandateId: mandate.id,
      planId: mandate.planId,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: endDate
    },
    update: { status: "ACTIVE" }
  });
}

// ============================================================
// MAIN POST HANDLER (Handles BOTH Webhook & User Redirect)
// ============================================================
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ------------------------------------------------------------
    // SCENARIO 1: IT IS A WEBHOOK (JSON)
    // ------------------------------------------------------------
    if (contentType.includes("application/json")) {
      const rawBody = await req.text();
      
      // 1. Security Check
      if (!verifySignature(req, rawBody)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = JSON.parse(rawBody);
      const type = body.type;

      if (type === "SUBSCRIPTION_STATUS_CHANGE") {
        if (body.data.subscription.subscription_status === "ACTIVE") {
          await activateSubscription(body.data.subscription.subscription_id);
        }
      }
      // Add other webhook events (RECURRING_PAYMENT_SUCCESS) here if needed

      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------
    // SCENARIO 2: IT IS A USER REDIRECT (FORM DATA)
    // ------------------------------------------------------------
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      
      const formData = await req.formData();
      // Cashfree often sends ID in the form, OR we might have it in the URL
      const subscriptionId = (formData.get("cf_subscription_id") as string) || 
                             new URL(req.url).searchParams.get("sub_id");

      if (!subscriptionId) {
        return NextResponse.redirect(new URL("/dashboard?error=missing_id", req.url));
      }

      // 1. Verify Status via API (Since we can't trust the form data fully without signature)
      const resp = await fetch(`${process.env.CASHFREE_BASE_URL}/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID!,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
          "x-api-version": "2025-01-01"
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        const status = data.subscription_status;

        if (status === "ACTIVE" || status === "BANK_APPROVAL_PENDING") {
          await activateSubscription(subscriptionId);
          // Redirect to Success Page (303 See Other turns POST into GET)
          return NextResponse.redirect(new URL("/dashboard/membership/success", req.url), 303);
        } else {
           return NextResponse.redirect(new URL(`/dashboard/membership/failure?status=${status}`, req.url), 303);
        }
      }
      
      return NextResponse.redirect(new URL("/dashboard?error=verification_failed", req.url), 303);
    }

    // Fallback
    return NextResponse.json({ error: "Unsupported Content Type" }, { status: 415 });

  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// ============================================================
// GET HANDLER (In case they redirect via GET in Production)
// ============================================================
export async function GET(req: Request) {
  // Reuse the logic by mocking a redirect
  const url = new URL(req.url);
  const subscriptionId = url.searchParams.get("sub_id");
  if (!subscriptionId) return NextResponse.redirect(new URL("/dashboard", req.url));

  // Just do the API check and redirect
  // (Copying logic for brevity, or you can extract to shared function)
   const resp = await fetch(`${process.env.CASHFREE_BASE_URL}/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID!,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
          "x-api-version": "2025-01-01"
        }
   });
   
   if (resp.ok) {
        const data = await resp.json();
        if (data.subscription_status === "ACTIVE" || data.subscription_status === "BANK_APPROVAL_PENDING") {
             await activateSubscription(subscriptionId);
             return NextResponse.redirect(new URL("/dashboard/membership/success", req.url));
        }
   }
   return NextResponse.redirect(new URL("/dashboard/membership/failure", req.url));
}