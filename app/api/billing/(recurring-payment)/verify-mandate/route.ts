import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { MandateStatus } from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
     const { baseUrl, appId, secret } = await getCashfreeConfig();

    const resp = await axios.get(
      `${baseUrl}/orders/${orderId}`,
      {
        headers: {
          "x-client-id": appId,
          "x-client-secret": secret,
          "x-api-version": "2023-08-01"
        }
      }
    );

    const mandateStatus = resp.data?.order_status;

    let status: MandateStatus = "PENDING";
    if (mandateStatus === "PAID") status = "ACTIVE";
    if (mandateStatus === "FAILED") status = "FAILED";

    const updatedMandate = await prisma.mandate.update({
      where: { mandateId: orderId },
      data: {
        status,
        paymentMethod: resp.data.payment_method
      }
    });

    return NextResponse.json({ mandate: updatedMandate });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error verifying mandate" }, { status: 500 });
  }
}
