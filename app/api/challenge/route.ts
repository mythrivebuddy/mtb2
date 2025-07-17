// app/api/challenge/route.ts

import { checkRole } from "@/lib/utils/auth";
import { ActivityType, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { challengeSchema } from "@/schema/zodSchema";
// --- 1. Import the deductJp function ---
import { deductJp } from "@/lib/utils/jp";

const prisma = new PrismaClient();

function generateSlug(title: string) {
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

    // --- 2. Fetch the full user object to get their plan and balance ---
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }, // Include plan details for accurate JP calculation
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const result = challengeSchema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.flatten().fieldErrors;
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
    } = result.data;

    // --- 3. Use a Prisma transaction to ensure atomicity ---
    // This makes sure that both the JP deduction and challenge creation succeed, or neither do.
    const newChallenge = await prisma.$transaction(async (tx) => {
      // Step A: Deduct JP for challenge creation.
      // The 'tx' object is passed to ensure this operation is part of the transaction.
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
            connect: { id: session.user.id },
          },
          tasks: {
            create: tasks.map((task) => ({ description: task.description })),
          },
        },
      });

      if (!challenge) {
        // If challenge creation fails, the transaction will be rolled back automatically.
        throw new Error("Failed to create challenge in database.");
      }

      return challenge;
    });

    return NextResponse.json(
      {
        message: "Challenge created successfully",
        data: newChallenge,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // --- 4. Add specific error handling for insufficient balance ---
    if (error.message === "Insufficient JP balance") {
      return NextResponse.json(
        {
          error: "You do not have enough JP to create this challenge.",
        },
        { status: 400 } // Use 400 for a client-side error (bad request)
      );
    }

    const errMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Failed to create challenge:", errMessage);

    return NextResponse.json(
      { error: "Failed to create challenge." },
      { status: 500 }
    );
  }
}