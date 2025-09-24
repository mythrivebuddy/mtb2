// app/api/login-streak/userStreak/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authConfig } from "../../auth/[...nextauth]/auth.config";
import { ActivityType} from "@prisma/client";

const STREAK_MILESTONES = [7, 21, 45, 90];

export async function POST(req: Request) {
  try {
    console.log("➡️ /api/streak POST called");

    // The session type is already augmented globally, so no custom types or casting are needed.
    const session = await getServerSession(authConfig);

    const userId = session?.user?.id;
    const isLogin = req.headers.get("activity-type") === "login";

    if (!userId) {
      console.error("❌ No userId in session");
      return NextResponse.json({ error: "Unauthorized: No userId in session" }, { status: 401 });
    }

    // Ensure user exists in DB; if missing create from session (safe fallback)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`⚠️ User not found for userId: ${userId}. Creating from session...`);
      const email = session?.user?.email ?? "";
      const name = session?.user?.name ?? "";
      const image = session?.user?.image ?? "";
      // Safely access the role from the globally typed session user.
      const role = session?.user?.role ?? "USER";

      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email,
            name,
            image,
            role,
            authMethod: "GOOGLE",
            isEmailVerified: true,
            isFirstTimeSurvey: true,
          },
        });
        console.log("✅ Created user in DB from session:", { id: user.id, email: user.email });
      } catch (createErr) {
        console.error("❌ Failed to create user from session:", createErr);
        return NextResponse.json({ error: "Failed to create missing user in DB" }, { status: 500 });
      }
    } else {
      console.log("✅ Found user in DB:", { id: user.id, email: user.email });
    }

    const now = new Date();

    // Get or initialize user streak
    let streak = await prisma.userStreak.findUnique({ where: { userId } });
    if (!streak) {
      console.log("✨ No streak found for user. Creating new streak entry...");
      streak = await prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 0,
          lastActiveDay: new Date(0),
          loginCount: 0,
        },
      });
      console.log("🆕 Created initial userStreak:", streak);
    } else {
      console.log("📊 Current streak record:", streak);
    }

    const lastActive = new Date(streak.lastActiveDay);
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    // If already active today
    if (daysDiff === 0) {
      if (isLogin) {
        console.log("🔄 Already logged in today, incrementing loginCount...");
        streak = await prisma.userStreak.update({
          where: { userId },
          data: { loginCount: { increment: 1 } },
        });
      }
      console.log("✅ Returning streak (already active today):", streak);
      return NextResponse.json({ streak });
    }

    // Determine new streak
    const newStreak = daysDiff === 1 ? streak.currentStreak + 1 : 1;
    if (daysDiff === 1) {
      console.log(`🔥 Continuing streak to ${newStreak} day(s).`);
    } else {
      console.log("⚠️ Missed day(s). Reset streak to 1.");
    }


    // Update streak record
    streak = await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        lastActiveDay: now,
        loginCount: isLogin ? streak.loginCount + 1 : streak.loginCount,
      },
    });
    console.log("📈 Updated streak:", streak);

    // Don't award beyond 90 days
    if (streak.currentStreak > 90) {
      console.log("🚫 Streak > 90 — skipping awards.");
      return NextResponse.json({ streak });
    }

    // Check milestone rewards
    if (STREAK_MILESTONES.includes(newStreak)) {
      const activityKey = `STREAK_${newStreak}_DAYS`;
      console.log(`🎯 Milestone hit: ${activityKey}. Looking up activity...`);

      const activity = await prisma.activity.findUnique({
        where: { activity: activityKey as ActivityType },
      });

      if (!activity) {
        console.warn(`⚠️ No activity config found for key: ${activityKey}`);
      } else {
        console.log("🏷 Found activity:", activity);
        const existingReward = await prisma.transaction.findFirst({
          where: { userId, activityId: activity.id },
        });

        if (existingReward) {
          console.log("ℹ️ Milestone reward already exists. Skipping award.");
        } else {
          console.log(`💎 Awarding ${activity.jpAmount} JP for ${newStreak}-day streak...`);

          await prisma.$transaction([
            prisma.transaction.create({
              data: {
                userId,
                activityId: activity.id,
                jpAmount: activity.jpAmount,
              },
            }),
            prisma.user.update({
              where: { id: userId },
              data: {
                jpEarned: { increment: activity.jpAmount },
                jpBalance: { increment: activity.jpAmount },
              },
            }),
            prisma.notification.create({
              data: {
                userId,
                type: "JP_EARNED",
                title: `🔥 ${newStreak}-Day Streak Achieved!`,
                message: `You earned ${activity.jpAmount} Joy Pearls for your ${newStreak}-day streak! Keep it up!`,
              },
            }),
          ]);

          console.log(`✅ Successfully awarded ${activity.jpAmount} JP for ${newStreak}-day streak.`);
        }
      }
    }

    return NextResponse.json({ streak });
  } catch (err: unknown) {
    console.error("❌ Unexpected error in /api/streak POST:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    // Check if the streak needs to be reset (user missed a day)
    if (streak) {
        const now = new Date();
        const lastActive = new Date(streak.lastActiveDay);
        const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 1) {
            console.log("GET: Streak broken. Returning 0.");
            return NextResponse.json({ streak: { ...streak, currentStreak: 0 } });
        }
    }

    return NextResponse.json({ streak });
  } catch (err: unknown) {
    console.error("❌ Error in /api/streak GET:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}