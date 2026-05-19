import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { sendPushNotificationFromDBToUser } from "@/lib/utils/pushNotifications";

export async function POST(req: Request) {
  await checkRole("ADMIN");

  try {
    const { userId, currency, referenceId, notes, type } = await req.json();
    const isAffiliate = type === "AFFILIATE";
    const holdingCutoff = new Date(
      Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );
    // 1️ get ONLY matured earnings
    const earnings = isAffiliate
      ? await prisma.affiliateEarningLedger.findMany({
          where: {
            affiliateId: userId,
            currency,
            status: "PENDING",
            createdAt: { lte: holdingCutoff },
          },
          orderBy: { createdAt: "asc" },
        })
      : await prisma.creatorEarningLedger.findMany({
          where: {
            creatorId: userId,
            currency,
            status: "PENDING",
            createdAt: { lte: holdingCutoff },
          },
          orderBy: { createdAt: "asc" },
        });

    if (!earnings.length) {
      return NextResponse.json(
        { error: "No matured earnings" },
        { status: 400 },
      );
    }

    // 2️ calculate total matured amount
    const total = earnings.reduce((sum, e) => sum + Number(e.earnedAmount), 0);

    // 3️ create payout
    const payout = await prisma.$transaction(async (tx) => {
      const payout = isAffiliate
        ? await tx.affiliatePayout.create({
            data: {
              affiliateId: userId,
              amount: total,
              currency,
              referenceId,
              notes,
              status: "PAID",
              paidAt: new Date(),
            },
          })
        : await tx.creatorPayout.create({
            data: {
              creatorId: userId,
              amount: total,
              currency,
              referenceId,
              notes,
              status: "PAID",
              paidAt: new Date(),
            },
          });

      if (isAffiliate) {
        await tx.affiliateEarningLedger.updateMany({
          where: {
            id: { in: earnings.map((e) => e.id) },
          },
          data: {
            status: "PAID",
            payoutId: payout.id,
          },
        });
      } else {
        await tx.creatorEarningLedger.updateMany({
          where: {
            id: { in: earnings.map((e) => e.id) },
          },
          data: {
            status: "PAID",
            payoutId: payout.id,
          },
        });
      }

      return payout;
    });
    // Fetch creator
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (creator?.email) {
      const formattedAmount = total.toFixed(2);
      const notifType = isAffiliate
        ? "AFFILIATE_PAYOUT_SUCCESS"
        : "CREATOR_PAYOUT_SUCCESS";

      await Promise.allSettled([
        sendEmailUsingTemplate({
          toEmail: creator.email,
          toName: creator.name || "Creator",
          templateId: isAffiliate ? "affiliate-payout-success":"creator-payout-success",
          templateData: {
            name: creator.name,
            amount: formattedAmount,
            currency,
            referenceId: referenceId || payout.id,
            paidAt: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            dashboardUrl: `${process.env.NEXT_URL}/dashboard/transactions-history`,
          },
        }),
        sendPushNotificationFromDBToUser({
          type: notifType,
          userId: creator.id,
          context: {
            amount: formattedAmount,
            currency,
            referenceId: referenceId || payout.id,
          },
        }),
      ]);
    }
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
