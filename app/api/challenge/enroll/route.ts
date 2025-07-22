import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp, assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
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

    // 3. Fetch user and challenge data
    const [joiner, challengeToJoin] = await Promise.all([
      prisma.user.findUnique({
        where: { id: joinerId },
        include: { plan: true },
      }),
      prisma.challenge.findUnique({
        where: { id: challengeId },
      }),
    ]);

    // 4. Perform validation checks
    if (!joiner)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (!challengeToJoin)
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    if (challengeToJoin.creatorId === joinerId)
      return NextResponse.json(
        { error: "You cannot join a challenge you created." },
        { status: 400 }
      );

    const existingEnrollment = await prisma.challengeEnrollment.findUnique({
      where: { userId_challengeId: { userId: joinerId, challengeId } },
    });
    if (existingEnrollment)
      return NextResponse.json(
        { error: "You are already enrolled in this challenge." },
        { status: 409 }
      );

    // 5. Fast transaction to create enrollment and handle fees
    const newEnrollment = await prisma.$transaction(async (tx) => {
      if (challengeToJoin.cost > 0) {
        const creator = await tx.user.findUnique({
          where: { id: challengeToJoin.creatorId },
          include: { plan: true },
        });
        if (!creator) throw new Error("Challenge creator could not be found.");
        await deductJp(joiner, ActivityType.CHALLENGE_JOINING_FEE, tx, {
          amount: challengeToJoin.cost,
        });
        await assignJp(creator, ActivityType.CHALLENGE_FEE_EARNED, tx, {
          amount: challengeToJoin.cost,
        });
      }

      return tx.challengeEnrollment.create({
        data: {
          userId: joinerId,
          challengeId: challengeId,
          status: "IN_PROGRESS",
        },
      });
    });

    // 6. "Fire-and-Forget" the background job
    fetch(
      // ✅ THE FIX: Changed "challenges" to "challenge" to match your folder path
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/challenge/process-enrollment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: newEnrollment.id }),
      }
    );

    // 7. Respond immediately with the correctly shaped object
    const enrollmentForFrontend = {
      ...newEnrollment,
      userTasks: [],
    };
    return NextResponse.json(
      { message: "Enrollment successful!", enrollment: enrollmentForFrontend },
      { status: 201 }
    );
  } catch (error) {
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
