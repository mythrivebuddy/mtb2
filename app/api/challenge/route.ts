// app/api/challenge/route.ts

import { prisma } from "@/lib/prisma"; // ✅ IMPORT THE SINGLETON INSTANCE
import { checkRole } from "@/lib/utils/auth";
import { deductJp } from "@/lib/utils/jp";
import { challengeSchema } from "@/schema/zodSchema";
import { ActivityType } from "@prisma/client";
import { NextResponse } from "next/server";

// A helper function to generate a URL-friendly slug from the title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function POST(request: Request) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = challengeSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.flatten().fieldErrors;
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    const {
      title,
      description,
      mode,
      cost,
      reward,
      penalty,
      startDate,
      endDate,
      tasks,
    } = validationResult.data;

    // ✅ APPLY THE TIMEOUT FIX HERE
    const newChallenge = await prisma.$transaction(async (tx) => {
      // Step A: Deduct JP for challenge creation.
      await deductJp(user, ActivityType.CHALLENGE_CREATION_FEE, tx);

      // Step B: Create the challenge.
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
          creator: { connect: { id: user.id } },
          templateTasks: {
            create: tasks.map((task) => ({ description: task.description })),
          },
        },
        include: { templateTasks: true },
      });

      if (!challenge) {
        throw new Error("Failed to create challenge in database.");
      }

      // Step C & D: Enroll creator and create their tasks
      await tx.challengeEnrollment.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          status: "IN_PROGRESS",
          userTasks: {
            create: challenge.templateTasks.map(templateTask => ({
              description: templateTask.description,
              templateTaskId: templateTask.id,
            }))
          }
        }
      });

      return challenge;
    }, {
      // Set timeouts to handle Vercel's network latency
      maxWait: 10000, // Wait up to 10s for a DB connection
      timeout: 20000, // Allow the transaction 20s to complete
    });

    return NextResponse.json(
      {
        message: "Challenge created and you have been enrolled!",
        data: newChallenge,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
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