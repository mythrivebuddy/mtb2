import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    await checkRole("ADMIN", "You are not authorized for this action!");

    const [
      todoCount,
      eventCount,
      challengeEnrollCount,
      challengeMsgCount,
      orderCount,
      cartCount,
      alignedActionCount,
      reminderCount,
      progressVaultCount,
      miracleLogCount,
      miniMasteryCount,
      activityFeedCount,
      groupMemberCount,

      // ✅ NEW
      makeoverProgressCount,
      spotlightCount,
      prosperityCount,
      buddyLensRequestCount,
      buddyLensReviewCount,
    ] = await Promise.all([
      prisma.todo.count(),
      prisma.event.count(),
      prisma.challengeEnrollment.count(),
      prisma.challengeMessage.count(),
      prisma.order.count(),
      prisma.cart.count(),
      prisma.alignedAction.count(),
      prisma.reminder.count(),
      prisma.progressVault.count(),
      prisma.miracleLog.count(),
      prisma.miniMasteryProgressLog.count(),
      prisma.activityFeedItem.count(),
      prisma.groupMember.count(),

      // ✅ NEW
      prisma.makeoverProgressLog.count(),
      prisma.spotlight.count(),
      prisma.prosperityDrop.count(),
      prisma.buddyLensRequest.count(),
      prisma.buddyLensReview.count(),
    ]);

    // ✅ Aggregate Features
    const featureUsage = [
      {
        feature: "PLAN_THE_DAY",
        usage: todoCount + eventCount,
      },
      {
        feature: "CHALLENGES",
        usage: challengeEnrollCount + challengeMsgCount,
      },
      {
        feature: "STORE",
        usage: orderCount + cartCount,
      },
      {
        feature: "SET_TODAYS_FOCUS",
        usage: alignedActionCount,
      },
      {
        feature: "REMINDERS",
        usage: reminderCount,
      },
      {
        feature: "PROGRESS_VAULT",
        usage: progressVaultCount,
      },
      {
        feature: "MIRACLE_LOG",
        usage: miracleLogCount,
      },
      {
        feature: "MINI_MASTERY",
        usage: miniMasteryCount,
      },
      {
        feature: "GROUPS",
        usage: activityFeedCount + groupMemberCount,
      },

      // ✅ NEW FEATURES
      {
        feature: "2026_COMPLETE_MAKEOVER_PROGRAM",
        usage: makeoverProgressCount,
      },
      {
        feature: "SPOTLIGHT",
        usage: spotlightCount,
      },
      {
        feature: "PROSPERITY",
        usage: prosperityCount,
      },
      {
        feature: "BUDDY_LENS",
        usage: buddyLensRequestCount + buddyLensReviewCount,
      },
    ];

    // ✅ Find most used feature
    const mostUsedFeature = featureUsage.sort(
      (a, b) => b.usage - a.usage
    )[0];

    // =========================
    // ✅ Most Active User
    // =========================

  // =========================
// ✅ Most Active User
// =========================

const mostActiveUserAgg = await prisma.transaction.groupBy({
  by: ["userId"],
  _count: {
    userId: true,
  },
  orderBy: {
    _count: {
      userId: "desc",
    },
  },
  take: 1,
});

let mostActiveUser = null;

if (mostActiveUserAgg.length > 0) {
  const userId = mostActiveUserAgg[0].userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (user) {
    mostActiveUser = {
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      activityCount: mostActiveUserAgg[0]._count.userId,
    };
  }
}

    return NextResponse.json({
      success: true,
      data: {
        mostUsedFeature,
        mostActiveUser,
      },
    });
  } catch (error) {
    console.error("Analytics API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}