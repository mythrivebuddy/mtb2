import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.adminPaymentGatewayConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    gateway: config?.activeGateway || "CASHFREE",
  });
}
