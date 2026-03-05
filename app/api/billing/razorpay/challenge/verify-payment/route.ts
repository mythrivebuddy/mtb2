// /api/billing/razorpay/challenge/verify-payment?orderId=order_123&challengeId=challenge_456

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  const session = await checkRole("USER");

  if (!session?.user?.id) {
    return NextResponse.json({ paid: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const challengeId = searchParams.get("challengeId");

  if (!orderId || !challengeId) {
    return NextResponse.json({ paid: false }, { status: 400 });
  }

  const order = await prisma.paymentOrder.findFirst({
    where: {
      razorpayOrderId: orderId,
      challengeId,
      userId: session.user.id,
      status: "PAID",
    },
  });

  return NextResponse.json({
    paid: !!order,
  });
}