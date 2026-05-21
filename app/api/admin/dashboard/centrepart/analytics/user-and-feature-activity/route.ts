import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// =========================
// ✅ Types
// =========================
type FeatureName =
  | "PLAN_THE_DAY"
  | "CHALLENGES"
  | "STORE"
  | "SET_TODAYS_FOCUS"
  | "REMINDERS"
  | "PROGRESS_VAULT"
  | "MIRACLE_LOG"
  | "MINI_MASTERY"
  | "ACCOUNTABILITY_HUB"
  | "2026_COMPLETE_MAKEOVER_PROGRAM"
  | "SPOTLIGHT"
  | "PROSPERITY"
  | "BUDDY_LENS";

type FeatureUsage = {
  feature: FeatureName;
  usage: number;
};

type MostActiveUser = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  activityCount: number;
};

type AnalyticsResponse = {
  success: true;
  data: {
    mostUsedFeature: FeatureUsage;
    mostActiveUser: MostActiveUser | null;
  };
};

// =========================
// ✅ In-memory cache
// =========================
let cachedData: AnalyticsResponse | null = null;
let lastFetchTime = 0;

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24h

// =========================
// ✅ API
// =========================
export async function GET() {
  try {
    const now = Date.now();

    // ✅ Serve from cache
    if (cachedData && now - lastFetchTime < CACHE_DURATION) {
      console.log("From cache response is returned")
      return NextResponse.json(cachedData);
    }

    // ✅ Auth
    await checkRole("ADMIN", "You are not authorized for this action!");

    // =========================
    // 🔥 DB QUERIES
    // =========================
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
      groupCount,
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
      prisma.group.count(),
      prisma.makeoverProgressLog.count(),
      prisma.spotlight.count(),
      prisma.prosperityDrop.count(),
      prisma.buddyLensRequest.count(),
      prisma.buddyLensReview.count(),
    ]);

    // =========================
    // ✅ Feature Usage
    // =========================
    const featureUsage: FeatureUsage[] = [
      { feature: "PLAN_THE_DAY", usage: todoCount + eventCount },
      { feature: "CHALLENGES", usage: challengeEnrollCount + challengeMsgCount },
      { feature: "STORE", usage: orderCount + cartCount },
      { feature: "SET_TODAYS_FOCUS", usage: alignedActionCount },
      { feature: "REMINDERS", usage: reminderCount },
      { feature: "PROGRESS_VAULT", usage: progressVaultCount },
      { feature: "MIRACLE_LOG", usage: miracleLogCount },
      { feature: "MINI_MASTERY", usage: miniMasteryCount },

      // ✅ Accountability Hub (correct mapping)
      {
        feature: "ACCOUNTABILITY_HUB",
        usage: groupCount + groupMemberCount + activityFeedCount,
      },

      { feature: "2026_COMPLETE_MAKEOVER_PROGRAM", usage: makeoverProgressCount },
      { feature: "SPOTLIGHT", usage: spotlightCount },
      { feature: "PROSPERITY", usage: prosperityCount },
      {
        feature: "BUDDY_LENS",
        usage: buddyLensRequestCount + buddyLensReviewCount,
      },
    ];

    const mostUsedFeature =
      featureUsage.sort((a, b) => b.usage - a.usage)[0];

    // =========================
    // ✅ Most Active User
    // =========================
    const mostActiveUserAgg = await prisma.transaction.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 1,
    });

    let mostActiveUser: MostActiveUser | null = null;

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

    const response: AnalyticsResponse = {
      success: true,
      data: {
        mostUsedFeature,
        mostActiveUser,
      },
    };

    // =========================
    // ✅ Cache result
    // =========================
    cachedData = response;
    lastFetchTime = now;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analytics API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}