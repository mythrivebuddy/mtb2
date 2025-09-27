// app/api/challenge/route.ts

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
  console.log("\n✅ --- /api/challenge endpoint reached --- ✅");

  try {
    // 1️⃣ Authenticate user
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      console.log("❌ ERROR: No session or user ID found.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`ℹ️ Searching for user with ID: ${userId}`);

    // 2️⃣ Fetch user and plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    console.log("ℹ️ Database result:", JSON.stringify(user, null, 2));

    if (!user) {
      console.log("❌ ERROR: User not found.");
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 3️⃣ Determine monthly limit (TypeScript-safe)
    let monthlyLimit: number;

    if (user.membership === "FREE") {
      monthlyLimit = 1;
    } else {
      if (!user.plan) {
        console.log("❌ ERROR: Paid user plan missing.");
        return NextResponse.json({ error: "Paid user plan not found." }, { status: 404 });
      }
      const planName = user.plan.name.toUpperCase();
      switch (planName) {
        case "MONTHLY":
          monthlyLimit = 5;
          break;
        case "YEARLY":
          monthlyLimit = 5;
          break;
        case "LIFETIME":
          monthlyLimit = 5;
          break;
        default:
          monthlyLimit = 5;
      }
      console.log(`ℹ️ User ${userId} has paid plan: ${user.plan.name}`);
    }

    // 4️⃣ Count challenges created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyChallengeCount = await prisma.challenge.count({
      where: {
        creatorId: userId,
        createdAt: { gte: startOfMonth },
      },
    });

    console.log(
      `ℹ️ User ${userId} has created ${monthlyChallengeCount} challenge(s) this month. Monthly limit: ${monthlyLimit}`
    );

    if (monthlyChallengeCount >= monthlyLimit) {
      console.log(`❌ User ${userId} has reached monthly challenge limit.`);
      return NextResponse.json(
        { error: "You have reached your monthly challenge creation limit." },
        { status: 403 }
      );
    }

    // 5️⃣ Validate request body
    const body = await request.json();
    const validationResult = challengeSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.flatten().fieldErrors;
      console.log(`❌ Validation errors for user ${userId}:`, errorMessages);
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    const { title, description, mode, cost, reward, penalty, startDate, endDate, tasks } =
      validationResult.data;

    // 6️⃣ Transaction: create challenge, enroll, deduct JP
    const newChallenge = await prisma.$transaction(async (tx) => {
      console.log(`ℹ️ Starting transaction for user ${userId}`);

      // A: Set RLS context
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', true);`
      );

      // B: Deduct JP
      await deductJp(user, ActivityType.CHALLENGE_CREATION_FEE, tx);
      console.log(
        `ℹ️ Deducted JP for user ${userId}. Current JP: ${user.jpBalance} (before deduction)`
      );

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
          creator: { connect: { id: userId } },
          templateTasks: {
            create: tasks.map((task) => ({ description: task.description })),
          },
        },
        include: { templateTasks: true },
      });

      console.log(`✅ Challenge created for user ${userId}: ${challenge.id}`);

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

      console.log(`✅ User ${userId} enrolled in challenge ${challenge.id} with tasks`);

      return challenge;
    }, { maxWait: 10000, timeout: 20000 });

    console.log(`✅ Transaction completed successfully for user ${userId}`);

    return NextResponse.json(
      { message: "Challenge created and you have been enrolled!", data: newChallenge },
      { status: 201 }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Failed to create challenge:", error.message);

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

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("❌ Unknown error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
