// File: app/api/challenges/enroll/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp"; // Make sure assignJp is imported
import { ActivityType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user (the "joiner")
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const joinerId = session.user.id;

    // 2. Get challengeId from the request body
    const { challengeId } = await request.json();
    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required." },
        { status: 400 }
      );
    }

    // 3. Fetch both the user and the challenge concurrently
    const [joiner, challengeToJoin] = await Promise.all([
      prisma.user.findUnique({
        where: { id: joinerId },
        include: { plan: true },
      }),
      prisma.challenge.findUnique({
        where: { id: challengeId },
        include: { templateTasks: true },
      }),
    ]);

    // 4. Perform validation checks
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
    const existingEnrollment = await prisma.challengeEnrollment.findUnique({
      where: { userId_challengeId: { userId: joinerId, challengeId } },
    });
    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this challenge." },
        { status: 409 } // 409 Conflict
      );
    }

    // 5. Use a transaction for the entire enrollment and fee transfer process
    await prisma.$transaction(async (tx) => {
      const joiningFee = challengeToJoin.cost;

      // Only perform the JP transfer if the challenge has a cost
      if (joiningFee > 0) {
        // Fetch the creator's user object INSIDE the transaction
        const creator = await tx.user.findUnique({
          where: { id: challengeToJoin.creatorId },
          include: { plan: true }, // Include plan for consistent function signature
        });

        if (!creator) {
          // This will cause the transaction to roll back
          throw new Error("Challenge creator could not be found.");
        }

        // Step A: Deduct the dynamic fee from the joiner's account
        await deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
          amount: joiningFee,
        });

        // Step B: Assign the same fee to the creator's account
        await assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
          amount: joiningFee,
        });
      }

      // Step C: Create the enrollment record and personal task copies for the joiner
      await tx.challengeEnrollment.create({
        data: {
          userId: joinerId,
          challengeId: challengeId,
          status: "IN_PROGRESS",
          userTasks: {
            create: challengeToJoin.templateTasks.map((templateTask) => ({
              description: templateTask.description,
              templateTaskId: templateTask.id,
            })),
          },
        },
      });
    });

    // 6. Return a success response
    return NextResponse.json(
      { message: "Successfully enrolled in the challenge!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Type-safe error handling
    if (error instanceof Error) {
      console.error("Failed to enroll in challenge:", error.message);

      // Check for specific, known error messages to provide better client feedback
      if (error.message.includes("Insufficient JP balance")) {
        return NextResponse.json(
          { error: "You do not have enough JP to join this challenge." },
          { status: 400 } // Bad Request
        );
      }

      // For other known errors, return the specific message
      return NextResponse.json(
        { error: error.message },
        { status: 500 } // Internal Server Error for other cases
      );
    }

    // Fallback for non-Error objects that might be thrown
    console.error("An unknown error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
