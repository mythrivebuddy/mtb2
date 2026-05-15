//! /api/cron/daily-cmp-reminders/quarter-ending-reminder

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getActiveQuarterAndDaysLeft,
  MTB_DEFAULT_END,
  MTB_DEFAULT_START,
} from "@/lib/utils/makeover-program/makeover-dashboard/get-weeks-quarters";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // ⚠️ testing support
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

    const todayResult = getActiveQuarterAndDaysLeft(
      today,
      startDate,
      endDate
    );

    if (!todayResult) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { daysLeft } = todayResult;
    const program = await prisma.program.findUnique({
        where:{
            slug:"2026-complete-makeover"
        }
    })
    /* ----------------------------------------------------
       1️⃣ Decide notification type (NO template fetching)
    ---------------------------------------------------- */
    let type: NotificationType | null = null;

    // A. Quarter ending soon (3 days left)
    if (daysLeft === 3) {
      type = NotificationType.CMP_QUARTER_ENDING_SOON;
    }

    // B. Quarter reset (new quarter started)
    if (yesterdayResult && yesterdayResult.daysLeft === 0) {
      type = NotificationType.CMP_QUARTER_RESET;
    }

    if (!type) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    /* ----------------------------------------------------
       2️⃣ Fetch users (single query)
    ---------------------------------------------------- */
    const users = await prisma.userProgramState.findMany({
      where: { onboarded: true ,programId:program?.id},
      select: { userId: true },
    });

    if (!users.length) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const userIds = [...new Set(users.map((u) => u.userId))];

    /* ----------------------------------------------------
       3️⃣ ✅ DB-driven bulk notification
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type,
      userIds,
      context: {
        daysLeft, 
      },
    });

    return NextResponse.json({
      ok: true,
      type,
      notifiedUsers: userIds.length,
    });
  } catch (error) {
    console.error("🔥 QUARTER REMINDER ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}