// app/api/challenge/route.ts

import { checkFeature } from "@/lib/access-control/checkFeature";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { deductJp } from "@/lib/utils/jp";
import { challengeSchema } from "@/schema/zodSchema";
import { ActivityType } from "@prisma/client";
import { NextResponse } from "next/server";

// Helper: create URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function POST(request: Request) {

  try {
    //  Authenticate user
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const featureResult = checkFeature({
      feature: "challenges",
      user: session.user,
    });

    if (!featureResult.allowed) {
      return NextResponse.json(
        { error: featureResult.reason },
        { status: 403 },
      );
    }

    const createLimit =
      typeof featureResult.config === "object"
        ? featureResult.config.createLimit
        : 0;

    //  Fetch user and include their plan (for the deductJp function)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true }, // <<< THIS LINE IS THE FIX
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    //  Count challenges created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyChallengeCount = await prisma.challenge.count({
      where: {
        creatorId: userId,
        createdAt: { gte: startOfMonth },
      },
    });

    //  Enforce the limit
    const limitResponse = await enforceLimitResponse({
      limit: createLimit,
      currentCount: monthlyChallengeCount,
      message:
        user.membership === "FREE"
          ? "You have reached your Free Membership limit of 1 challenge per month. Please upgrade."
          : `You have reached your monthly challenge creation limit.`,
    });

    if (limitResponse) {
      return limitResponse;
    }

    //  Validate request body
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
      social_link_task,
      isIssuingCertificate,
    } = validationResult.data;

    // Transaction: create challenge, enroll, deduct JP
    const newChallenge = await prisma.$transaction(
      async (tx) => {

        // A: Set RLS context
        await tx.$executeRawUnsafe(
          `SELECT set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', true);`,
        );

        // B: Deduct JP
        await deductJp(user, ActivityType.CHALLENGE_CREATION_FEE, tx);

        // C: Create challenge
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
            isIssuingCertificate,
            creator: { connect: { id: userId } },
            templateTasks: {
              create: tasks.map((task) => ({ description: task.description })),
            },
            social_link_task: social_link_task ?? "",
          },
          include: { templateTasks: true },
        });


        // D: Enroll creator and create tasks
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
      },
      { maxWait: 10000, timeout: 20000 },
    );

    return NextResponse.json(
      {
        message: "Challenge created and you have been enrolled!",
        data: newChallenge,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Failed to create challenge:", error.message);

      if (
        error.message.includes("new row violates row-level security policy")
      ) {
        return NextResponse.json(
          { error: "You have reached Free Membership Limit." },
          { status: 403 },
        );
      }

      if (error.message === "Insufficient JP balance") {
        return NextResponse.json(
          {
            error: "You do not have enough JP to create this challenge.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("❌ Unknown error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
