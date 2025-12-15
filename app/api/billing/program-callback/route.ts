import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");
    const purchaseId = url.searchParams.get("purchase_id");

    if (!orderId || !purchaseId) {
      return NextResponse.redirect(
        new URL("/dashboard/membership/failure?reason=missing_ids", req.url),
        303
      );
    }

    const { baseUrl, appId, secret } = await getCashfreeConfig();

    const resp = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01"
      }
    });

    const data: {
      order_status?: string;
      cf_order_id?: string;
    } = await resp.json();

    if (data.order_status === "PAID" || data.order_status === "COMPLETED") {
      await prisma.oneTimeProgramPurchase.updateMany({
        where: {
          id: purchaseId,
          status: { not: PaymentStatus.PAID }
        },
        data: {
          status: PaymentStatus.PAID,
          cashfreeOrderId: data.cf_order_id ?? undefined
        }
      });

      return NextResponse.redirect(
        new URL("/dashboard/membership/success?program=true", req.url),
        303
      );
    }

    if (data.order_status === "FAILED" || data.order_status === "CANCELLED") {
      await prisma.oneTimeProgramPurchase.updateMany({
        where: {
          id: purchaseId,
          status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] }
        },
        data: { status: PaymentStatus.FAILED }
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/membership/failure", req.url),
      303
    );
  } catch (err) {
    console.error("Program Callback Error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/membership/failure?reason=server_error", req.url),
      303
    );
  }
}
