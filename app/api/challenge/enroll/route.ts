// File: app/api/challenges/enroll/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user and get their ID
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get the challengeId from the request body
    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required." },
        { status: 400 }
      );
    }

    // 3. Find the challenge and its template tasks to perform checks
    const challengeToJoin = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        // We need the template tasks to create copies for the new user
        templateTasks: true,
      },
    });

    // 4. Perform validation checks
    if (!challengeToJoin) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    if (challengeToJoin.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "This challenge is not open for enrollment." },
        { status: 400 }
      );
    }
    
    // Check if the user is already enrolled
    const existingEnrollment = await prisma.challengeEnrollment.findUnique({
        where: {
            userId_challengeId: {
                userId: userId,
                challengeId: challengeId,
            }
        }
    });

    if (existingEnrollment) {
        return NextResponse.json(
            { error: "You are already enrolled in this challenge." },
            { status: 409 } // 409 Conflict
        );
    }

    // 5. Use a transaction to ensure both enrollment and task creation succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Step A: Create the enrollment record for the user.
      // Step B: Simultaneously create a personal copy of each task for that user.
      await tx.challengeEnrollment.create({
        data: {
          userId: userId,
          challengeId: challengeId,
          status: "IN_PROGRESS", // Explicitly set status
          
          // This nested 'create' is the key fix. It creates a UserChallengeTask
          // for each template task associated with the challenge.
          userTasks: {
            create: challengeToJoin.templateTasks.map(templateTask => ({
              description: templateTask.description,
              templateTaskId: templateTask.id,
            }))
          }
        }
      });
    });

    // 6. Return a success response
    return NextResponse.json(
      {
        message: "Successfully enrolled in the challenge!",
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Failed to enroll in challenge:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
  