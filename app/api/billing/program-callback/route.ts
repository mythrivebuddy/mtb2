import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { extractOrderFailureReason } from "@/lib/payment/payment.utils";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");
    const purchaseId = url.searchParams.get("purchase_id");

    const { baseUrl, appId, secret } = await getCashfreeConfig();

    if (!orderId || !purchaseId) {
      return NextResponse.redirect(new URL("/dashboard/membership/failure?reason=missing_ids", req.url), 303);
    }

    // verify with cashfree
    const resp = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01"
      }
    });

    const data = await resp.json();
    const status = data.order_status;

    if (status === "PAID" || status === "COMPLETED") {
      return NextResponse.redirect(new URL("/dashboard/membership/success?program=true", req.url), 303);
    }

    const reason = extractOrderFailureReason(data);

    await prisma.oneTimeProgramPurchase.update({
      where: { id: purchaseId },
      data: { status: PaymentStatus.FAILED }
    });

    return NextResponse.redirect(
      new URL(`/dashboard/membership/failure?type=program&orderId=${orderId}&reason=${encodeURIComponent(reason)}`, req.url),
      303
    );

  } catch (err) {
    console.error("Program Callback Error:", err);
    return NextResponse.redirect(new URL("/dashboard/membership/failure?reason=server_error", req.url), 303);
  }
}
