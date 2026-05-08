import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import {
  replaceDynamicNotificationTemplate,
  sendPushNotificationToUser,
} from "@/lib/utils/pushNotifications";

type PayoutNotificationTemplateData = {
  amount: string;
  currency: string;
  referenceId: string;
};

export async function POST(req: Request) {
  await checkRole("ADMIN");

  try {
    const { creatorId, currency, referenceId, notes } = await req.json();

    const holdingCutoff = new Date(
      Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );
    // 1️ get ONLY matured earnings
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

    // 2️ calculate total matured amount
    const total = earnings.reduce((sum, e) => sum + Number(e.earnedAmount), 0);

    // 3️ create payout
    const payout = await prisma.$transaction(async (tx) => {
      const payout = await tx.creatorPayout.create({
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

      await tx.creatorEarningLedger.updateMany({
        where: {
          id: { in: earnings.map((e) => e.id) },
        },
        data: {
          status: "PAID",
          payoutId: payout.id,
        },
      });

      return payout;
    });
    // Fetch creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, name: true, email: true },
    });

    if (creator?.email) {
      const formattedAmount = total.toFixed(2);
      const notifSetting = await prisma.notificationSettings.findUnique({
        where: { notification_type: "CREATOR_PAYOUT_SUCCESS" },
      });

      const notificationTemplateData: PayoutNotificationTemplateData = {
        amount: formattedAmount,
        currency,
        referenceId: referenceId || payout.id,
      };

      const title = replaceDynamicNotificationTemplate(
        notifSetting?.title || "💸 Payout processed",
        notificationTemplateData,
      );

      const message = replaceDynamicNotificationTemplate(
        notifSetting?.message || "Your payout has been processed successfully.",
        notificationTemplateData,
      );

      const url: string =
        notifSetting?.url || "/dashboard/transactions-history";
      const results = await Promise.allSettled([
        sendEmailUsingTemplate({
          toEmail: creator.email,
          toName: creator.name || "Creator",
          templateId: "creator-payout-success",
          templateData: {
            name: creator.name || "Creator",
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

        sendPushNotificationToUser(creator.id, title, message, { url }),
        prisma.notification.create({
          data: {
            userId: creator.id,
            type: "CREATOR_PAYOUT_SUCCESS",
            title,
            message,
            metadata: {
              url,
            },
          },
        }),
      ]);

      results.forEach((r) => {
        if (r.status === "rejected") {
          console.error("Payout notification failed", {
            creatorId,
            error: r.reason,
          });
        }
      });
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
