import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function POST(req: Request) {
  await checkRole("ADMIN");

  try {
    const { creatorId, currency, referenceId, notes } = await req.json();

    // 1️⃣ get pending earnings
    const earnings = await prisma.creatorEarningLedger.findMany({
      where: {
        creatorId,
        currency,
        status: "PENDING",
      },
    });

    if (!earnings.length) {
      return NextResponse.json(
        { error: "No pending earnings" },
        { status: 400 },
      );
    }

    // 2️⃣ calculate total
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

    // 4️⃣ mark earnings as paid
    await prisma.creatorEarningLedger.updateMany({
      where: {
        id: { in: earnings.map((e) => e.id) },
      },
      data: {
        status: "PAID",
        payoutId: payout.id,
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
