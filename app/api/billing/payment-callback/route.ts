import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

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
      `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID!,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
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

    return NextResponse.redirect(
      new URL(`/dashboard/membership/failure?status=${status}`, req.url),
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
  const orderId = new URL(req.url).searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const resp = await fetch(
    `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`,
    {
      method: "GET",
      headers: {
        "x-client-id": process.env.CASHFREE_CLIENT_ID!,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
        "x-api-version": "2023-08-01",
      },
    }
  );

  if (resp.ok) {
    const data = await resp.json();

    if (data.order_status === "PAID" || data.order_status === "COMPLETED") {
      await prisma.subscription.updateMany({
        where: { orderId },
        data: { status: "ACTIVE" },
      });

      return NextResponse.redirect(
        new URL("/dashboard/membership/success", req.url)
      );
    }
  }

  return NextResponse.redirect(
    new URL("/dashboard/membership/failure", req.url)
  );
}
