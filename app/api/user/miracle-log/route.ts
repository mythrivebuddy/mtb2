import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType, StreakType } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";
import { startOfDay } from "date-fns";
import { checkFeature } from "@/lib/access-control/checkFeature";

export async function GET() {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch only logs that haven't been soft-deleted
    const logs = await prisma.miracleLog.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null, // Filter out soft-deleted logs
      },
      orderBy: { createdAt: 'desc' }, // Optional: sort by creation date
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const featureResult = checkFeature({
      feature: "miracleLog",
      user: session.user,
    });

    if (!featureResult.allowed) {
      return NextResponse.json(
        { error: featureResult.reason },
        { status: 403 }
      );
    }

    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ message: "Valid content is required" }, { status: 400 });
    }

    const today = startOfDay(new Date());
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Count active (non-deleted) logs for today
    const activeLogsToday = await prisma.miracleLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
          lte: endOfDay
        },
        deletedAt: null
      }
    });

    // if (activeLogsToday >= 3) {
    //   return NextResponse.json(
    //     { message: "Daily limit of 3 active logs reached" },
    //     { status: 400 }
    //   );
    // }
    const dailyLimit =
      typeof featureResult.config === "object"
        ? featureResult.config.dailyLimit
        : 0;

    if (activeLogsToday >= dailyLimit) {
      return NextResponse.json(
        {
          message: `Daily limit of ${dailyLimit} miracle logs reached`,
        },
        { status: 400 }
      );
    }

    // Create a new log
    const log = await prisma.miracleLog.create({
      data: {
        content,
        userId: session.user.id,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    });

    if (user) {
      try {
        // Get all logs from today that have JP points assigned
        const logsWithJpToday = await prisma.miracleLog.findMany({
          where: {
            userId: session.user.id,
            createdAt: {
              gte: today,
              lte: endOfDay
            },
            jpPointsAssigned: true,
          },
        });

        if (logsWithJpToday.length >= 3) {
          return NextResponse.json({
            log,
            warning: "You have already received JP points for 3 logs today. No additional JP points will be awarded.",
          });
        }

        // Award JP points and mark the log
        await assignJp(user, ActivityType.MIRACLE_LOG);
        await prisma.miracleLog.update({
          where: { id: log.id },
          data: { jpPointsAssigned: true },
        });

        // Handle streak - only increment if this is the first log of the day
        if (activeLogsToday === 1) {
          const streak = await prisma.streak.findUnique({
            where: {
              userId_type: {
                userId: session.user.id,
                type: StreakType.MIRACLE_LOG
              }
            },
          });

          if (!streak) {
            // Create new streak starting at 1
            await prisma.streak.create({
              data: {
                user: { connect: { id: session.user.id } },
                type: StreakType.MIRACLE_LOG,
                miracle_log_count: 1,
                miracle_log_last_at: today,
              },
            });

            // Create streak history entry
            await prisma.streakHistory.create({
              data: {
                user: { connect: { id: session.user.id } },
                type: StreakType.MIRACLE_LOG,
                count: 1,
                date: today,
              },
            });
          } else {
            const lastLogDate = streak.miracle_log_last_at ? startOfDay(new Date(streak.miracle_log_last_at)) : null;
            const daysSinceLastLog = lastLogDate ? Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

            if (daysSinceLastLog === null || daysSinceLastLog > 1) {
              // Reset streak to 0 if broken
              await prisma.streak.update({
                where: {
                  userId_type: {
                    userId: session.user.id,
                    type: StreakType.MIRACLE_LOG
                  }
                },
                data: {
                  miracle_log_count: 0,
                  miracle_log_last_at: null,
                },
              });
              // Create streak history entry for reset
              await prisma.streakHistory.create({
                data: {
                  user: { connect: { id: session.user.id } },
                  type: StreakType.MIRACLE_LOG,
                  count: 0,
                  date: today,
                },
              });
              // Start new streak at 1
              await prisma.streak.update({
                where: {
                  userId_type: {
                    userId: session.user.id,
                    type: StreakType.MIRACLE_LOG
                  }
                },
                data: {
                  miracle_log_count: 1,
                  miracle_log_last_at: today,
                },
              });
              await prisma.streakHistory.create({
                data: {
                  user: { connect: { id: session.user.id } },
                  type: StreakType.MIRACLE_LOG,
                  count: 1,
                  date: today,
                },
              });
            } else if (daysSinceLastLog === 1) {
              // Increment streak if exactly 1 day has passed
              const newStreak = streak.miracle_log_count + 1;
              // After 90 days, do not give further rewards
              let rewardActivity: ActivityType | null = null;
              if (newStreak === 7) {
                rewardActivity = ActivityType.MIRACLE_STREAK_REWARD_7_DAYS;
              } else if (newStreak === 21) {
                rewardActivity = ActivityType.MIRACLE_STREAK_REWARD_21_DAYS;
              } else if (newStreak === 45) {
                rewardActivity = ActivityType.MIRACLE_STREAK_REWARD_45_DAYS;
              } else if (newStreak === 90) {
                rewardActivity = ActivityType.MIRACLE_STREAK_REWARD_90_DAYS;
              }
              // Update streak count
              await prisma.streak.update({
                where: {
                  userId_type: {
                    userId: session.user.id,
                    type: StreakType.MIRACLE_LOG
                  }
                },
                data: {
                  miracle_log_count: newStreak,
                  miracle_log_last_at: today,
                },
              });
              await prisma.streakHistory.create({
                data: {
                  user: { connect: { id: session.user.id } },
                  type: StreakType.MIRACLE_LOG,
                  count: newStreak,
                  date: today,
                },
              });
              // Award JP for milestone if applicable and streak <= 90
              if (rewardActivity && newStreak <= 90) {
                await assignJp(user, rewardActivity);
              }
            }
            // If daysSinceLastLog === 0, do nothing as it's the same day
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("Daily JP limit")) {
          console.log("Daily JP limit reached, but log was created");
          return NextResponse.json({
            log,
            warning: "Miracle log created, but you've reached the daily JP limit of 150",
          });
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      message: "Log created successfully",
      log,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
