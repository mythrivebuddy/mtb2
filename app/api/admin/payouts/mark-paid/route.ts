import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";

export async function POST(req: Request) {
  await checkRole("ADMIN");

  try {
    const { creatorId, currency, referenceId, notes } = await req.json();

    const holdingCutoff = new Date(
      Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    // 1️⃣ get ONLY matured earnings
    const earnings = await prisma.creatorEarningLedger.findMany({
      where: {
        creatorId,
        currency,
        status: "PENDING",
        createdAt: { lte: holdingCutoff },
      },
      orderBy: { createdAt: "asc" }, // FIFO
    });

    if (!earnings.length) {
      return NextResponse.json(
        { error: "No matured earnings" },
        { status: 400 },
      );
    }

    // 2️⃣ calculate total matured amount
    const total = earnings.reduce((sum, e) => sum + Number(e.earnedAmount), 0);

    // 3️⃣ create payout
    const payout = await prisma.creatorPayout.create({
      data: {
        creatorId,
        amount: total,
        currency,
        referenceId,
        notes,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // 4️⃣ map earnings to payout (NO DUPLICATION)
    await prisma.creatorEarningLedger.updateMany({
      where: {
        id: { in: earnings.map((e) => e.id) },
      },
      data: {
        status: "PAID",
        payoutId: payout.id, // ✅ link to payout
      },
    });


    return NextResponse.json({
      success: true,
      payout,
      totalPaid: total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Payout failed" }, { status: 500 });
  }
}
