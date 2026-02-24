// app/api/challenge/enroll/route.ts\\

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { sendMessageForJoining } from "@/lib/utils/system-message-for-joining";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { LimitType } from "@/lib/access-control/featureConfig";
import { getLimitPeriodStart } from "@/lib/access-control/limitPeriod";


export const maxDuration = 60; // 60 seconds
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const joinerId = session.user.id;
    const { challengeId } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required." },
        { status: 400 }
      );
    }

    // ✅ GOOD: Fetching the challenge and its tasks separately is efficient.
    const challengeToJoin = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challengeToJoin) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }
    if (challengeToJoin.joinMode === "SYSTEM_ONLY") {
      return NextResponse.json(
        { error: "This challenge can only be joined via program onboarding." },
        { status: 403 }
      );
    }
    // Fetch the joiner and check for existing enrollment concurrently.
    const [joiner, existingEnrollment] = await Promise.all([
      prisma.user.findUnique({
        where: { id: joinerId },
        include: { plan: true }, // Required for deductJp
      }),
      prisma.challengeEnrollment.findUnique({
        where: { userId_challengeId: { userId: joinerId, challengeId } },
      }),
    ]);

    if (!joiner) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this challenge." },
        { status: 409 }
      );
    }
    // 🚦 Enforce join limit ONLY for MANUAL challenges
    // 🚦 Enforce join limit ONLY for MANUAL challenges
    if (challengeToJoin.joinMode === "MANUAL") {
      const featureCheck = checkFeature({
        feature: "challenges",
        user: {
          userType: joiner.userType,
          membership: joiner.membership,
        },
      });

      if (!featureCheck.allowed) {
        return NextResponse.json(
          { error: "Challenge access not allowed" },
          { status: 403 }
        );
      }

      const { joinLimit, limitType, isUpgradeFlagShow } = featureCheck.config as {
        joinLimit: number;
        limitType: LimitType;
        isUpgradeFlagShow: boolean;
      };

      const periodStart = getLimitPeriodStart(limitType);

      const joinedCount = await prisma.challengeEnrollment.count({
        where: {
          userId: joinerId,
          ...(periodStart && {
            joinedAt: { gte: periodStart },
          }),
        },
      });

      const limitResponse = await enforceLimitResponse({
        limit: joinLimit,
        currentCount: joinedCount,
        message:
          joiner.membership === "PAID"
            ? "You have reached your challenge join limit."
            : `You have reached your challenge join limit.`,
        statusCode: joiner.membership === "PAID" ? 400 : 403,
        isUpgradeFlagShow,
      });

      if (limitResponse) {
        return limitResponse;
      }
    }


    // Fetch the template tasks associated with this challenge.
    const templateTasks = await prisma.challengeTask.findMany({
      where: { challengeId: challengeId },
    });

    if (challengeToJoin.creatorId === joinerId) {
      return NextResponse.json(
        { error: "You cannot join a challenge you created." },
        { status: 400 }
      );
    }


    // Fetch creator only if there's a cost
    const creator =
      challengeToJoin.cost > 0
        ? await prisma.user.findUnique({
          where: { id: challengeToJoin.creatorId },
          include: { plan: true }, // Required for assignJp
        })
        : null;

    if (challengeToJoin.cost > 0 && !creator) {
      return NextResponse.json(
        { error: "Challenge creator could not be found." },
        { status: 404 }
      );
    }

    // --- Transaction for Database Operations Only ---
    const newEnrollment = await prisma.$transaction(
      async (tx) => {
        // 1. Handle JP cost if applicable
        if (challengeToJoin.cost > 0 && creator) {
          await Promise.all([
            deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
              amount: challengeToJoin.cost,
            }),
            assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
              amount: challengeToJoin.cost,
            }),
          ]);
        }

        // 2. Create the enrollment record
        const enrollment = await tx.challengeEnrollment.create({
          data: {
            userId: joinerId,
            challengeId,
            status: "IN_PROGRESS",
          },
        });

        // 3. Create the user's tasks from the templates
        if (templateTasks && templateTasks.length > 0) {
          await tx.userChallengeTask.createMany({
            data: templateTasks.map((task) => ({
              description: task.description,
              enrollmentId: enrollment.id,
              templateTaskId: task.id, // ✅ Good, this required field is present
            })),
          });
        }

        // Return the enrollment data so we can use it after the transaction
        return enrollment;
      },
      { timeout: 15000 } // Keep a reasonable timeout for the transaction itself
    );

    // --- ⚠️ REFACTOR: Perform External API Calls AFTER the transaction succeeds ---
    // This ensures the database is not locked while waiting for the network.
    // This is a "fire-and-forget" call; we don't need to `await` it to send the response to the user.
    const userName = session?.user?.name || "Someone"
    const joinedUserId = session.user.id;

    void sendMessageForJoining(challengeId, userName, null, "SYSTEM", joinedUserId);

    const existingEnrollments = await prisma.challengeEnrollment.findMany({
      where: { challengeId },
      select: { userId: true },
    });

    const participantIds = existingEnrollments.map((e) => e.userId);
    const notificationRecipients = Array.from(
      new Set([challengeToJoin.creatorId, ...participantIds])
    ).filter((id) => id !== joinedUserId); // Don't notify the person who just joined

    // 3. Use your new batch function
    void sendPushNotificationMultipleUsers(
      notificationRecipients,
      "New challenger alert 🚀",
      `${userName} joined "${challengeToJoin.title}"!`,
      { url: "/dashboard/challenge/my-challenges" }
    );

    // Respond to the client immediately after the database is updated.
    return NextResponse.json(
      {
        message: "Enrollment successful!",
        enrollmentId: newEnrollment.id,
      },
      { status: 201 }
    );

  } catch (error) {
    // ✅ IMPROVEMENT: Log the full error object for better debugging insights.
    console.error("Enrollment transaction failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("Insufficient GP balance")) {
        return NextResponse.json(
          { error: "You do not have enough GP to join this challenge." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
