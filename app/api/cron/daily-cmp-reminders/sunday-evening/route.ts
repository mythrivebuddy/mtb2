// /api/cron/daily-cmp-reminders/sunday-evening
// Todo we need to remove this api too becuase we are handling using the /api/cron/daily-cmp-reminders/combined-primary-nudge-sunday
import { prisma } from "@/lib/prisma";
import { getISTEndOfWeek, getISTStartOfWeek } from "@/lib/utils/dateUtils";
import { sendDbPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { NotificationType } from "@prisma/client";

export async function GET() {
  try {
    const weekStart = getISTStartOfWeek();
    const weekEnd = getISTEndOfWeek();
  const program = await prisma.program.findUnique({
    where:{
      slug:"2026-complete-makeover",
    },
    select:{
      id:true,
    }
  })
    /* ----------------------------------------------------
       1️⃣ Fetch all onboarded users
    ---------------------------------------------------- */
    const users = await prisma.userProgramState.findMany({
      where: { onboarded: true,programId:program?.id },
      select: { userId: true },
    });

    if (!users.length) {
      return Response.json({
        status: "ok",
        type: "sunday-evening",
        sent: 0,
      });
    }

    const userIds = [...new Set(users.map((u) => u.userId))];

    /* ----------------------------------------------------
       2️⃣ Fetch completed users (single query)
    ---------------------------------------------------- */
    const completedThisWeek = await prisma.sundayProgressLog.findMany({
      where: {
        userId: { in: userIds },
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
        card1WeeklyWin: true,
        card2Done: true,
        // card3 optional
      },
      select: { userId: true },
    });

    const completedSet = new Set(
      completedThisWeek.map((c) => c.userId)
    );

    /* ----------------------------------------------------
       3️⃣ Filter eligible users
    ---------------------------------------------------- */
    const eligibleUserIds = userIds.filter(
      (userId) => !completedSet.has(userId)
    );

    if (!eligibleUserIds.length) {
      return Response.json({
        status: "ok",
        type: "sunday-evening",
        sent: 0,
      });
    }

    /* ----------------------------------------------------
       4️⃣ ✅ DB-driven bulk notification
    ---------------------------------------------------- */
    await sendDbPushNotificationMultipleUsers({
      type: NotificationType.CMP_SUNDAY_EVENING_PENDING,
      userIds: eligibleUserIds,
      context: {}, // optional dynamic later
    });

    console.log(
      `[SUNDAY] Evening reminder sent to ${eligibleUserIds.length} users`
    );

    return Response.json({
      status: "ok",
      type: "sunday-evening",
      sent: eligibleUserIds.length,
    });
  } catch (error) {
    console.error("🔥 SUNDAY EVENING ERROR:", error);

    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}