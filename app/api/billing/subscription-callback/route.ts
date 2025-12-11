// app/api/billing/subscription-callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractMandateFailureReason, verifySignature } from "@/lib/payment/payment.utils";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";



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
  await prisma.user.update({
    where: { id: mandate.userId },
    data: { membership: "PAID" }
  });
}

// ============================================================
// MAIN POST HANDLER (Handles BOTH Webhook & User Redirect)
// ============================================================
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
     const { baseUrl, appId, secret } = await getCashfreeConfig();

    // ------------------------------------------------------------
    // SCENARIO 1: IT IS A WEBHOOK (JSON)
    // ------------------------------------------------------------
    if (contentType.includes("application/json")) {
      const rawBody = await req.text();
      
      // 1. Security Check
      if (!verifySignature(req, rawBody, secret)) {
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
      const resp = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          "x-client-id": appId,
          "x-client-secret": secret,
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
          const reason = extractMandateFailureReason(data);

return NextResponse.redirect(
  new URL(
    `/dashboard/membership/failure?type=mandate&sub_id=${subscriptionId}&reason=${encodeURIComponent(reason)}`,
    req.url
  ),
  303
);
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
  const url = new URL(req.url);
  const subscriptionId = url.searchParams.get("sub_id");
  const { baseUrl, appId, secret } = await getCashfreeConfig();

  // Case 1: No subscriptionId at all (Cashfree failed to return anything)
  if (!subscriptionId) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/membership/failure?type=mandate&reason=${encodeURIComponent(
          "Mandate was not completed. Your bank did not redirect properly."
        )}`,
        req.url
      ),
      303
    );
  }

  // Call Cashfree API to verify mandate
  const resp = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secret,
      "x-api-version": "2025-01-01"
    }
  });

  if (!resp.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/membership/failure?type=mandate&sub_id=${subscriptionId}&reason=${encodeURIComponent(
          "Unable to verify mandate status"
        )}`,
        req.url
      ),
      303
    );
  }

  const data = await resp.json();
  const status = data.subscription_status;

  // Case 2: Mandate Success
  if (status === "ACTIVE" || status === "BANK_APPROVAL_PENDING") {
    await activateSubscription(subscriptionId);

    return NextResponse.redirect(
      new URL(`/dashboard/membership/success`, req.url), 
      303
    );
  }

  // Case 3: Failure with details
  const failureReason =
    data.last_payment?.failure_reason ||
    data.subscription_failure_reason ||
    data.subscription_status_description ||
    data.subscription_status ||
    "Mandate creation failed";

  return NextResponse.redirect(
    new URL(
      `/dashboard/membership/failure?type=mandate&sub_id=${subscriptionId}&reason=${encodeURIComponent(
        failureReason
      )}`,
      req.url
    ),
    303
  );
}
