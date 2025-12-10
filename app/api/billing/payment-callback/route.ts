import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractOrderFailureReason } from "@/lib/payment/payment.utils";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
     const { baseUrl, appId, secret } = await getCashfreeConfig();

    const orderId =
      (form.get("orderId") as string) ||
      new URL(req.url).searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.redirect(
        new URL("/dashboard/membership/failure?reason=no_order_id", req.url),
        303
      );
    }

    // VERIFY ORDER STATUS VIA CASHFREE API
    const resp = await fetch(
      `${baseUrl}/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "x-client-id": appId,
          "x-client-secret": secret,
          "x-api-version": "2023-08-01",
        },
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data || !data.order_status) {
      return NextResponse.redirect(
        new URL("/dashboard/membership/failure?reason=verification_failed", req.url),
        303
      );
    }

    const status = data.order_status;

    // CASHFREE ORDER STATUSES
    if (status === "PAID" || status === "COMPLETED") {
      // Activate Lifetime Subscription
      const subscription = await prisma.subscription.findFirst({
        where: { orderId },
      });

      if (subscription) {
      console.log("subscription found");
      
        await prisma.subscription.updateMany({
          where: { orderId },
          data: { status: "ACTIVE" },
        });
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { membership: "PAID" }
        });
      }

      return NextResponse.redirect(
        new URL("/dashboard/membership/success", req.url),
        303
      );
    }
  const reason = extractOrderFailureReason(data);

return NextResponse.redirect(
  new URL(
    `/dashboard/membership/failure?type=lifetime&orderId=${orderId}&reason=${encodeURIComponent(reason)}`,
    req.url
  ),
  303
);



  } catch (e) {
    console.error("Lifetime Callback Error:", e);
    return NextResponse.redirect(
      new URL("/dashboard/membership/failure?reason=server_error", req.url),
      303
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  const { baseUrl, appId, secret, mode } = await getCashfreeConfig();

  // Case 1: Cashfree redirected with no order_id at all
  if (!orderId) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/membership/failure?type=lifetime&reason=${encodeURIComponent(
          "Payment was cancelled before reaching the bank"
        )}`,
        req.url
      ),
      303
    );
  }

  // Fetch latest order status from Cashfree
  const resp = await fetch(
    `${baseUrl}/orders/${orderId}`,
    {
      method: "GET",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01",
      },
    }
  );

  if (!resp.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/membership/failure?type=lifetime&orderId=${orderId}&reason=${encodeURIComponent(
          "Unable to verify payment"
        )}`,
        req.url
      ),
      303
    );
  }

  const data = await resp.json();
  const status = data.order_status;

  // Case 2: Successful Payment
  if (status === "PAID" || status === "COMPLETED") {
    await prisma.subscription.updateMany({
      where: { orderId },
      data: { status: "ACTIVE" },
    });

    return NextResponse.redirect(
      new URL("/dashboard/membership/success", req.url)
    );
  }

  // =====================================================
  // SANDBOX FAILURE INTELLIGENT DETECTION
  // Cashfree sandbox is broken and often returns:
  // order_status = "ACTIVE" even on simulated declines.
  // =====================================================

  let reason = "Payment failed";

  // If sandbox decline was simulated, Cashfree sometimes returns:
  // payment_message: "Bank declined the transaction"
  const sandboxError =
    data.payment_message ||
    data.order_status_description ||
    data.payment?.error_text ||
    data.payment?.bank_error_message ||
    null;

  // Case 3: REAL FAILED OR CANCELLED STATES
  if (status === "FAILED") {
    reason = sandboxError || "Bank declined the payment";
  } else if (status === "CANCELLED") {
    reason = "You cancelled the payment";
  }

  // Case 4: PENDING means user left in middle
  else if (status === "PENDING") {
    reason = "Payment was started but not completed";
  }

  // Case 5: ACTIVE in sandbox = FAILURE
  else if (status === "ACTIVE") {
    // Sandbox-aware detection: use any error message Cashfree might have sent
    if (sandboxError) {
      reason = sandboxError;
    } else {
      reason =
        mode === "sandbox"
          ? "Sandbox mode: Bank Decline simulated (Cashfree did not send real failure details)"
          : "Payment was not completed";
    }
  }

  // Case 6: Everything else fallback
  else {
    reason = sandboxError || "Payment failed";
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard/membership/failure?type=lifetime&orderId=${orderId}&reason=${encodeURIComponent(
        reason
      )}`,
      req.url
    ),
    303
  );
}


