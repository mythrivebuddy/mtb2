// /api/admin/payouts/[creatorId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";

export async function GET(
  req: Request,
  { params }: { params: { creatorId: string } },
) {
  await checkRole("ADMIN");
  const contextParams = await params;
  const creatorId = contextParams.creatorId;
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get("currency");

  const holdingCutoff = new Date(
    Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );

  // 1️⃣ Fetch the creator details ONCE
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { name: true, email: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // 2️⃣ Fetch earnings and include ONLY the PaymentOrder -> User (Buyer)
  const earnings = await prisma.creatorEarningLedger.findMany({
    where: {
      creatorId,
      ...(currency && { currency }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      paymentOrder: {
        include: {
          user: {
            select: { name: true, email: true }, // 👤 Gets the Buyer Details
          },
        },
      },
    },
  });

  // 3️⃣ Extract the context IDs to fetch the actual Product Names
  const challengeIds = earnings
    .filter((e) => e.contextType === "CHALLENGE")
    .map((e) => e.contextId);
  const mmpIds = earnings
    .filter((e) => e.contextType === "MMP_PROGRAM")
    .map((e) => e.contextId);
  const storeIds = earnings
    .filter((e) => e.contextType === "STORE_PRODUCT")
    .map((e) => e.contextId);

  // 4️⃣ Fetch the titles from their respective tables
  const [challenges, mmps, storeProducts] = await Promise.all([
    prisma.challenge.findMany({
      where: { id: { in: challengeIds } },
      select: { id: true, title: true },
    }),
    prisma.program.findMany({
      where: { id: { in: mmpIds } },
      select: { id: true, name: true },
    }),
    prisma.item.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    }),
  ]);

  // 5️⃣ Map the IDs to their Titles for quick lookup
  const itemNameMap = new Map<string, string>();
  challenges.forEach((c) => itemNameMap.set(c.id, c.title));
  mmps.forEach((m) => itemNameMap.set(m.id, m.name));
  storeProducts.forEach((s) => itemNameMap.set(s.id, s.name));

  // 6️⃣ Format the final output
  const formatted = earnings.map((e) => {
    const discountAmount = Number(e.paymentOrder?.discountApplied || 0);

    return {
      ...e,
      isHolding: e.status === "PENDING" && e.createdAt > holdingCutoff,
      isMatured: e.status === "PENDING" && e.createdAt <= holdingCutoff,

      discountApplied: discountAmount,

      // Attach Buyer Data from PaymentOrder
      buyerName: e.paymentOrder?.user?.name || "Unknown Buyer",
      buyerEmail: e.paymentOrder?.user?.email || "N/A",

      // Attach the actual Product Name
      itemName: itemNameMap.get(e.contextId) || "Unknown Item",
    };
  });

  //  Return the single creator object alongside the earnings array
  return NextResponse.json({ creator, earnings: formatted });
}
