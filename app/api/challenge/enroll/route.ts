// File: app/api/enroll/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

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

    // ✅ CORRECTED QUERY: Fetch the challenge and its template tasks separately.
    const challengeToJoin = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challengeToJoin) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }
    
    // Fetch the template tasks associated with this challenge.
    // This assumes you have a model named `ChallengeTask` linked to the challenge.
    const templateTasks = await prisma.challengeTask.findMany({
        where: { challengeId: challengeId },
    });


    if (challengeToJoin.creatorId === joinerId) {
      return NextResponse.json(
        { error: "You cannot join a challenge you created." },
        { status: 400 }
      );
    }

    // Fetch the joiner and check for existing enrollment
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

    // ✅ MODIFIED TRANSACTION: Now creates enrollment AND tasks together.
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

        // 3. ✅ CRITICAL FIX: Create the user's tasks from the template tasks we fetched.
        if (templateTasks && templateTasks.length > 0) {
          await tx.userChallengeTask.createMany({
            data: templateTasks.map((task) => ({
              description: task.description,
              enrollmentId: enrollment.id,
              templateTaskId: task.id, // ✅ ERROR FIX: Added the missing required field.
            })),
          });
        }

        // 4. Send notification
        sendPushNotificationToUser(
          challengeToJoin.creatorId,
          "New challenger alert 🚀",
          `${session.user.name} joined "${challengeToJoin.title}"!`,
          { url: "/dashboard/challenge/my-challenges" }
        );

        return enrollment;
      },
      { timeout: 15000 }
    );

    // Respond to the client
    return NextResponse.json(
      {
        message: "Enrollment successful!",
        enrollmentId: newEnrollment.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Enrollment error:", error.message);
      if (error.message.includes("Insufficient JP balance")) {
        return NextResponse.json(
          { error: "You do not have enough JP to join this challenge." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error during enrollment:", error);
    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
