import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { AffiliateCommissionType } from "@prisma/client";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

export async function PATCH(req: NextRequest) {
  try {
    await checkRole("ADMIN");

    const body = await req.json();
    const { userId, affiliatePercent, commissionType } = body;

    // ✅ Basic validation
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // ✅ Enum validation (clean & type-safe)
    if (
      !commissionType ||
      !Object.values(AffiliateCommissionType).includes(commissionType)
    ) {
      return NextResponse.json(
        { error: "Invalid commissionType" },
        { status: 400 },
      );
    }

    if (
      typeof affiliatePercent !== "number" ||
      affiliatePercent <= 0 ||
      affiliatePercent > 100
    ) {
      return NextResponse.json(
        { error: "affiliatePercent must be between 1 and 100" },
        { status: 400 },
      );
    }

    // ✅ Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAffiliate: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const isFirstTimeAffiliate = !user.isAffiliate;
    // ✅ Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isAffiliate: true,
        affiliatePercent,
        affiliateCommissionType: commissionType as AffiliateCommissionType,
        affiliateEnabledAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAffiliate: true,
        affiliatePercent: true,
        affiliateCommissionType: true,
      },
    });
    // ✅ ADDED: Fetch Notification Settings from DB
    const notifSetting = await prisma.notificationSettings.findUnique({
      where: { notification_type: "AFFILIATE_APPROVED" },
    });

    // Fallbacks just in case the seeder hasn't run yet
    const notifTitle = notifSetting?.title || "🎉 You are now an Affiliate!";
    const notifMessage =
      notifSetting?.message ||
      "Your affiliate account is active. Start earning commission on your referrals!";
    const notifUrl = notifSetting?.url || "/dashboard/refer-friend";

    if (isFirstTimeAffiliate && updatedUser.email) {
      Promise.allSettled([
        // . Send Email
        sendEmailUsingTemplate({
          toEmail: updatedUser.email,
          toName: updatedUser.name || "Affiliate",
          templateId: "affiliate-welcome",
          templateData: {
            name: updatedUser.name || "Affiliate",
            referEarnUrl: `${process.env.NEXT_URL || "https://www.mythrivebuddy.com"}/dashboard/refer-friend`,
          },
        }),

        // . Send Web Push Notification
        sendPushNotificationToUser(updatedUser.id, notifTitle, notifMessage, {
          url: notifUrl,
        }),
      ]).catch((err) =>
        console.error("Failed to send affiliate notifications:", err),
      );
    }

    return NextResponse.json({
      message: "User is now an affiliate",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Make affiliate error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
