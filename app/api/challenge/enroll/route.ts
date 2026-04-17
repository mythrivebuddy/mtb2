// app/api/challenge/enroll/route.ts\\

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType, ChallengeJoiningType } from "@prisma/client";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { sendMessageForJoining } from "@/lib/utils/system-message-for-joining";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { LimitType } from "@/lib/access-control/featureConfig";
import { getLimitPeriodStart } from "@/lib/access-control/limitPeriod";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { formatDate } from "@/lib/utils/dateUtils";

// Define this interface near the top of the file or in your featureConfig types
interface ChallengesFeatureConfig {
  joinLimit: number;
  limitType: LimitType;
  isUpgradeFlagShow: boolean;
  commissionPercent: number;
}
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
        { status: 400 },
      );
    }

    // ✅ GOOD: Fetching the challenge and its tasks separately is efficient.
    const challengeToJoin = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challengeToJoin) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 },
      );
    }
    if (challengeToJoin.joinMode === "SYSTEM_ONLY") {
      return NextResponse.json(
        { error: "This challenge can only be joined via program onboarding." },
        { status: 403 },
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
        { status: 409 },
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
          { status: 403 },
        );
      }

      const { joinLimit, limitType, isUpgradeFlagShow } =
        featureCheck.config as ChallengesFeatureConfig;

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
        { status: 400 },
      );
    }

    // Fetch creator only if there's a cost
    const isPaid =
  challengeToJoin.challengeJoiningType === ChallengeJoiningType.PAID;

const creator =
 await prisma.user.findUnique({
        where: { id: challengeToJoin.creatorId },
        include: { plan: true },
      })

    if (challengeToJoin.cost > 0 && !creator) {
      return NextResponse.json(
        { error: "Challenge creator could not be found." },
        { status: 404 },
      );
    }

    // --- Transaction for Database Operations Only ---
    const newEnrollment = await prisma.$transaction(
      async (tx) => {
        // 1. Handle JP cost if applicable
        if (challengeToJoin.cost > 0 && creator) {
          await deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
            amount: challengeToJoin.cost,
            metadata: {
              challengeId: challengeToJoin.id,
              challengeTitle: challengeToJoin.title,
            },
          });
          await assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
            amount: challengeToJoin.cost,
            metadata: {
              joinerId: joiner.id,
              joinerName: joiner.name,
              challengeTitle: challengeToJoin.title,
            },
          });
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
      { timeout: 15000 }, // Keep a reasonable timeout for the transaction itself
    );

    // --- ⚠️ REFACTOR: Perform External API Calls AFTER the transaction succeeds ---
    // This ensures the database is not locked while waiting for the network.
    // This is a "fire-and-forget" call; we don't need to `await` it to send the response to the user.
    const userName = session?.user?.name || "Someone";
    const joinedUserId = session.user.id;

    void sendMessageForJoining(
      challengeId,
      userName,
      null,
      "SYSTEM",
      joinedUserId,
    );

    const existingEnrollments = await prisma.challengeEnrollment.findMany({
      where: { challengeId },
      select: { userId: true },
    });

    const participantIds = existingEnrollments.map((e) => e.userId);
    const notificationRecipients = Array.from(
      new Set([challengeToJoin.creatorId, ...participantIds]),
    ).filter((id) => id !== joinedUserId); // Don't notify the person who just joined

    // 3. Use your new batch function
    void sendPushNotificationMultipleUsers(
      notificationRecipients,
      "New challenger alert 🚀",
      `${userName} joined "${challengeToJoin.title}"!`,
      { url: `/dashboard/challenge/my-challenges/${challengeToJoin.id}` },
    );


    const paidOrder = isPaid
      ? await prisma.paymentOrder.findFirst({
          where: {
            userId: joinerId,
            challengeId: challengeToJoin.id,
            status: "PAID",
            contextType: "CHALLENGE",
          },
          orderBy: {
            paidAt: "desc",
          },
        })
      : null;

    // ✅ ONLY RUN FOR PAID CHALLENGE
    let baseAmount = 0;
    let discount = 0;
    let gst = 0;
    let totalPaid = 0;
    let finalPayable = 0;

    let commissionPercent = 0;
    let platformFee = 0;
    let coachEarning = 0;
    let netBase = 0;

    if (isPaid && paidOrder && creator) {
      baseAmount = Number(paidOrder.baseAmount ?? 0);
      discount = Number(paidOrder.discountApplied ?? 0);
      gst = Number(paidOrder.gstAmount ?? 0);
      totalPaid = Number(paidOrder.totalAmount ?? 0);

      finalPayable = Number((baseAmount - discount + gst).toFixed(2));

      // If gateway forced ₹1 minimum
      if (finalPayable <= 0 && totalPaid > 0) {
        finalPayable = totalPaid;
      }

      const feature = checkFeature({
        feature: "challenges",
        user: {
          userType: creator.userType,
          membership: creator.membership,
        },
      });

      if (feature.allowed) {
        commissionPercent =
          (feature.config as ChallengesFeatureConfig).commissionPercent ?? 0;
      }

      // ✅ SINGLE SOURCE OF TRUTH
      netBase = Number((baseAmount - discount).toFixed(2));

      if (netBase <= 0) {
        platformFee = totalPaid;
        coachEarning = 0;
      } else {
        platformFee = Number(((netBase * commissionPercent) / 100).toFixed(2));
        coachEarning = Number((netBase - platformFee).toFixed(2));
      }

      platformFee = Number(((netBase * commissionPercent) / 100).toFixed(2));

      coachEarning = Number((netBase - platformFee).toFixed(2));
    }
    // ⚠️ Optional safety (recommended)
    if (isPaid && !paidOrder) {
      return NextResponse.json(
        { error: "Payment not found for this challenge." },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_URL || "https://www.mythrivebuddy.com";

    //  Email Data (FULLY FIXED)
    const emailData = {
      username: joiner.name || "User",
      userEmail: joiner.email,
      coachName: creator?.name || "Coach",

      challengeName: challengeToJoin.title,

      startDate: challengeToJoin.startDate
        ? formatDate(challengeToJoin.startDate)
        : "N/A",

      challengeType: isPaid ? "Paid" : "Free",

      // ✅ USER CTA
      challengeUrl: `${baseUrl}/dashboard/challenge/my-challenges/${challengeToJoin.id}`,

      // ✅ COACH CTA (FIXED — for View Participants)
      participantsUrl: `${baseUrl}/dashboard/challenge/${challengeToJoin.id}/participants`,

      // ✅ FIX: No amount for free challenge
      amount: isPaid ? finalPayable : null,

      transactionId: paidOrder?.paymentId || paidOrder?.orderId || "N/A",
      paymentMethod: paidOrder?.paymentMethod || "Online",

      // ✅ Coach payment breakdown
      baseAmount,
      discount,
      netBase,
      gst,
      totalPaid,

      commissionPercent,
      platformFee,
      coachEarning,

      paymentDate: paidOrder?.paidAt ? formatDate(paidOrder?.paidAt) : "N/A",

      // ✅ Coach paid CTA
      transactionPageUrl: `${baseUrl}/dashboard/transactions-history`,
    };
    // ✅ USER EMAIL
    const shouldSkipUserEmail = isPaid;

    if (!shouldSkipUserEmail) {
      console.log("📧 Sending USER email");

      void sendEmailUsingTemplate({
        toEmail: joiner.email!,
        toName: joiner.name || "User",
        templateId: isPaid ? "challenge-joined-paid" : "challenge-joined-free",
        templateData: emailData,
      }).catch((err) => console.error("User email failed:", err.message));
    } else {
      console.log("🚫 Skipping USER email (admin paid challenge)");
    }

    // ✅ COACH EMAIL
    // ✅ COACH EMAIL (SAFE)
    if (creator && creator.id !== joiner.id) {
      const templateId = isPaid
        ? "coach-user-joined-paid-challenge"
        : "coach-user-joined-challenge";
      void sendEmailUsingTemplate({
        toEmail: creator.email,
        toName: creator.name || "Coach",
        templateId,
        templateData: emailData,
      }).catch((err) => console.error("Coach email failed:", err.message));
    }
    // Respond to the client immediately after the database is updated.
    return NextResponse.json(
      {
        message: "Enrollment successful!",
        enrollmentId: newEnrollment.id,
      },
      { status: 201 },
    );
  } catch (error) {
    // ✅ IMPROVEMENT: Log the full error object for better debugging insights.
    console.error("Enrollment transaction failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("Insufficient GP balance")) {
        return NextResponse.json(
          { error: "You do not have enough GP to join this challenge." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 },
    );
  }
}
