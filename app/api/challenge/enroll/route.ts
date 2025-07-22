// File: app/api/challenges/enroll/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp";
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
    await prisma.$transaction(
      async (tx) => {
        const joiningFee = challengeToJoin.cost;

        if (joiningFee > 0) {
          const creator = await tx.user.findUnique({
            where: { id: challengeToJoin.creatorId },
            include: { plan: true },
          });

          if (!creator) {
            throw new Error("Challenge creator could not be found.");
          }

          await deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
            amount: joiningFee,
          });

          await assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
            amount: joiningFee,
          });
        }

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
      },
      {
        // ✅ THIS IS THE FIX
        // Add a timeout to handle the network latency on Vercel
        maxWait: 10000, // Wait up to 10s for a DB connection
        timeout: 20000, // Allow the transaction 20s to complete
      }
    );

    // 6. Return a success response
    return NextResponse.json(
      { message: "Successfully enrolled in the challenge!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to enroll in challenge:", error.message);

      if (error.message.includes("Insufficient JP balance")) {
        return NextResponse.json(
          { error: "You do not have enough JP to join this challenge." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("An unknown error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
