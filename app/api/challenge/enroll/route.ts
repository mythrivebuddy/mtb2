import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import axios from "axios"; // your axios instance
import { getAxiosErrorMessage } from "@/utils/ax"; // error handler

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const joinerId = session.user.id;

    // Step 1: Parse body
    const { challengeId } = await request.json();
    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required." },
        { status: 400 }
      );
    }

    // Step 2: Early check for duplicate enrollment
    const existingEnrollment = await prisma.challengeEnrollment.findUnique({
      where: { userId_challengeId: { userId: joinerId, challengeId } },
    });
    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this challenge." },
        { status: 409 }
      );
    }

    // Step 3: Fetch user and challenge (include plan)
    const [joiner, challengeToJoin] = await Promise.all([
      prisma.user.findUnique({
        where: { id: joinerId },
        include: { plan: true }, // ✅ Required for deductJp
      }),
      prisma.challenge.findUnique({
        where: { id: challengeId },
      }),
    ]);

    if (!joiner) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!challengeToJoin) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    if (challengeToJoin.creatorId === joinerId) {
      return NextResponse.json(
        { error: "You cannot join a challenge you created." },
        { status: 400 }
      );
    }

    // ✨ OPTIMIZATION: Fetch the creator *before* the transaction begins.
    const creator =
      challengeToJoin.cost > 0
        ? await prisma.user.findUnique({
            where: { id: challengeToJoin.creatorId },
            include: { plan: true }, // ✅ Required for assignJp
          })
        : null;

    if (challengeToJoin.cost > 0 && !creator) {
      // If there's a cost but the creator wasn't found, throw an error.
      return NextResponse.json(
        { error: "Challenge creator could not be found." },
        { status: 404 }
      );
    }

    // Step 4: Create enrollment with JP deduction in a more efficient transaction
    const newEnrollment = await prisma.$transaction(
      async (tx) => {
        if (challengeToJoin.cost > 0 && creator) {
          // Process JP deduction and assignment in parallel
          await Promise.all([
            deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
              amount: challengeToJoin.cost,
            }),
            assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
              amount: challengeToJoin.cost,
            }),
          ]);
        }

        return tx.challengeEnrollment.create({
          data: {
            userId: joinerId,
            challengeId,
            status: "IN_PROGRESS",
          },
        });
      },
      { timeout: 15000 }
    );

    // Step 5: Fire background job (non-blocking)
    setTimeout(() => {
      axios
        .post(
          `${process.env.NEXT_PUBLIC_TEST_URL}/api/challenge/process-enrollment`,
          {
            enrollmentId: newEnrollment.id,
          }
        )
        .catch((err) => {
          console.error(
            "Failed to trigger background processing:",
            getAxiosErrorMessage(err)
          );
        });
    }, 0);

    // Step 6: Respond to client
    return NextResponse.json(
      {
        message: "Enrollment successful!",
        enrollment: {
          ...newEnrollment,
          userTasks: [],
        },
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