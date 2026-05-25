// /api/cron/daily-cmp-reminders/sunday-morning
// Todo we need to remove this api too becuase we are handling using the /api/cron/daily-cmp-reminders/combined-primary-nudge-sunday
import { prisma } from "@/lib/prisma";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    /* ----------------------------------------------------
       1️⃣ Fetch onboarded users
    ---------------------------------------------------- */
    const program = await prisma.program.findUnique({
      where:{
        slug:"2026-complete-makeover",
      },
      select:{id:true}
    })
    const users = await prisma.userProgramState.findMany({
      where: { onboarded: true,programId:program?.id },
      select: { userId: true },
    });

    if (!users.length) {
      return NextResponse.json({
        status: "ok",
        type: "sunday-morning",
        sent: 0,
      });
    }

    const userIds = [...new Set(users.map((u) => u.userId))];

    /* ----------------------------------------------------
       2️⃣ ✅ DB-driven bulk notification
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_SUNDAY_MORNING,
      userIds,
      context: {}, // optional dynamic later
    });

    console.log(
      `[SUNDAY] Morning reminder sent to ${userIds.length} users`
    );

    return NextResponse.json({
      status: "ok",
      type: "sunday-morning",
      sent: userIds.length,
    });
  } catch (error) {
    console.error("🔥 SUNDAY MORNING ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}