// app/api/challenge/route.ts

import { checkRole } from "@/lib/utils/auth";
import { deductJp } from "@/lib/utils/jp";
import { challengeSchema } from "@/schema/zodSchema";
import { ActivityType, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Using the global prisma instance is better practice if you have one.
// import { prisma } from "@/lib/utils/prisma";
const prisma = new PrismaClient();

// A helper function to generate a URL-friendly slug from the title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user and get their session
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the full user object to get their plan and balance for JP deduction
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }, // Include plan details for accurate JP calculation
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 3. Parse and validate the request body
    const body = await request.json();
    const validationResult = challengeSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.flatten().fieldErrors;
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    // Destructure the validated data
    const {
      title,
      description,
      mode,
      cost,
      reward,
      penalty,
      startDate,
      endDate,
      tasks, // This is an array of task objects, e.g., [{ description: "Read a book" }]
    } = validationResult.data;

    // 4. Use a Prisma transaction to ensure atomicity (all or nothing)
    const newChallenge = await prisma.$transaction(async (tx) => {
      // Step A: Deduct JP for challenge creation.
      await deductJp(user, ActivityType.CHALLENGE_CREATION_FEE, tx);

      // Step B: If JP deduction is successful, create the challenge.
      const challenge = await tx.challenge.create({
        data: {
          title,
          slug: generateSlug(title),
          description,
          mode,
          cost,
          reward,
          penalty,
          startDate,
          endDate,
          status: "UPCOMING",
          creator: {
            connect: { id: user.id },
          },
          // Use the 'templateTasks' relation to create shared task templates
          templateTasks: {
            create: tasks.map((task) => ({ description: task.description })),
          },
        },
        // We must include the created template tasks to use them in the next step
        include: {
          templateTasks: true,
        },
      });

      if (!challenge) {
        throw new Error("Failed to create challenge in database.");
      }

      // --- NEW: Step C: Automatically enroll the creator in their own challenge ---
      await tx.challengeEnrollment.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          status: "IN_PROGRESS",
          // --- NEW: Step D: Create the user-specific tasks for the creator ---
          // This creates a personal copy of each task for the user who just created the challenge.
          userTasks: {
            create: challenge.templateTasks.map(templateTask => ({
              description: templateTask.description,
              templateTaskId: templateTask.id,
            }))
          }
        }
      });

      return challenge;
    });

    // 5. Send a successful response
    return NextResponse.json(
      {
        message: "Challenge created and you have been enrolled!",
        data: newChallenge,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Type-safe error handling
    if (error instanceof Error) {
      if (error.message === "Insufficient JP balance") {
        return NextResponse.json(
          { error: "You do not have enough JP to create this challenge." },
          { status: 400 }
        );
      }
      console.error("Failed to create challenge:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("An unknown error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
