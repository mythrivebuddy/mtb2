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

    // 3. Find the challenge in the database to perform checks
    const challengeToJoin = await prisma.challenge.findUnique({
      where: { id: challengeId },
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
            { status: 409 } // 409 Conflict is a good status code for this
        );
    }

    // 5. If all checks pass, create the new enrollment record
    const newEnrollment = await prisma.challengeEnrollment.create({
      data: {
        userId: userId,
        challengeId: challengeId,
        // The status, joinedAt, and streak fields will use their default values
      },
    });

    // 6. Return a success response
    return NextResponse.json(
      {
        message: "Successfully enrolled in the challenge!",
        enrollment: newEnrollment,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Failed to enroll in challenge:", error);
    // This will catch potential database errors, like the unique constraint failing
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
