// app/api/challenge/route.ts

import { prisma } from "@/lib/prisma";
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

    const userId = session.user.id; // Store user ID for clarity

   const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    // This condition now checks for both user and user.plan
    if (!user || !user.plan) { 
      return NextResponse.json(
        { error: "User or user plan not found." },
        { status: 404 }
      );
    }

 

    // ✨ --- MODIFIED MONTHLY LIMIT LOGIC STARTS HERE --- ✨

    // 1. Determine the user's monthly limit based on their plan
    let monthlyLimit: number;
    const planName = user.plan.name.toUpperCase(); // Case-insensitive check

    if (planName === 'FREE') {
      monthlyLimit = 1;
    } else {
      // For any other plan (MONTHLY, YEARLY, LIFETIME, etc.)
      monthlyLimit = 5;
    }

    // 2. Calculate the start of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 3. Count challenges created by the user THIS month
    const monthlyChallengeCount = await prisma.challenge.count({
      where: {
        creatorId: userId,
        createdAt: {
          gte: startOfMonth, // gte = "greater than or equal to"
        },
      },
    });

    // 4. Compare the monthly count with the user's plan limit
    if (monthlyChallengeCount >= monthlyLimit) {
      return NextResponse.json(
        { error: "You have reached your monthly challenge creation limit." },
        { status: 403 } // 403 Forbidden
      );
    }
    // ✨ --- MODIFIED MONTHLY LIMIT LOGIC ENDS HERE --- ✨

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

    const newChallenge = await prisma.$transaction(async (tx) => {
      // Step A: Set the user context for the RLS policy (defense-in-depth).
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', true);`
      );

      // Step B: Deduct JP for challenge creation.
      await deductJp(user, ActivityType.CHALLENGE_CREATION_FEE, tx);

      // Step C: Create the challenge.
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
          creator: { connect: { id: userId } },
          templateTasks: {
            create: tasks.map((task) => ({ description: task.description })),
          },
        },
        include: { templateTasks: true },
      });

      if (!challenge) {
        throw new Error("Failed to create challenge in database.");
      }

      // Step D & E: Enroll creator and create their tasks
      await tx.challengeEnrollment.create({
        data: {
          challengeId: challenge.id,
          userId: userId,
          status: "IN_PROGRESS",
          userTasks: {
            create: challenge.templateTasks.map((templateTask) => ({
              description: templateTask.description,
              templateTaskId: templateTask.id,
            })),
          },
        },
      });

      return challenge;
    }, {
      maxWait: 10000,
      timeout: 20000,
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
      if (error.message.includes("new row violates row-level security policy")) {
        return NextResponse.json(
          { error: "You have reached Free Membership Limit." },
          { status: 403 }
        );
      }
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