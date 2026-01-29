//! /api/cron/daily-cmp-reminders/quarter-ending-reminder
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    getActiveQuarterAndDaysLeft,
    MTB_DEFAULT_END,
    MTB_DEFAULT_START,
} from "@/lib/utils/makeover-program/makeover-dashboard/get-weeks-quarters";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { CMP_NOTIFICATIONS } from "@/lib/constant";

export async function GET(req: NextRequest) {
    // search params only for testing with ?date=2026-03-28 not use search params in production
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const today = dateParam ? new Date(dateParam) : new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);



    const startDate = MTB_DEFAULT_START;
    const endDate = MTB_DEFAULT_END;

    const yesterdayResult = getActiveQuarterAndDaysLeft(
        yesterday,
        startDate,
        endDate
    );
    const result = getActiveQuarterAndDaysLeft(today, startDate, endDate);

    if (!result) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    const { daysLeft } = result;

    let notification;

    // 🔹 A. Quarter Ending Reminder (3 days before)
    if (daysLeft === 3) {
        notification = CMP_NOTIFICATIONS.QUARTER_ENDING_SOON;
    }

    // 🔹 B. Quarter Reset Reminder (first day of new quarter)

    if (yesterdayResult && yesterdayResult.daysLeft === 0) {
        notification = CMP_NOTIFICATIONS.QUARTER_RESET;
    }


    if (!notification) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    const users = await prisma.userProgramState.findMany({
        where: { onboarded: true },
        select: { userId: true },
    });

    const userIds = users.map((u) => u.userId);

    await sendPushNotificationMultipleUsers(userIds, notification.title, notification.description, { url: notification.url },);

    return NextResponse.json({
        ok: true,
        type: notification.title,
        notifiedUsers: userIds.length,
    });
}
