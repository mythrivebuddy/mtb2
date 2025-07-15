/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRole } from "@/lib/utils/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { challengeSchema } from "@/schema/zodSchema";

const prisma = new PrismaClient();

function generateSlug(title: string) {
  return title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
}

export async function POST(request: Request) {
  try {
    // ✅ 1. First get the user from the session
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. Get the data from the frontend
    const body = await request.json();

    // ✅ 3. Validate using zod schema
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

    // ✅ 4. Check all fields are not empty (redundant with Zod, but added for clarity)
    if (
      !title ||
      !description ||
      !mode ||
      cost == null ||
      reward == null ||
      penalty == null ||
      !startDate ||
      !endDate ||
      !Array.isArray(tasks) ||
      tasks.length === 0
    ) {
      return NextResponse.json(
        { error: "All fields are required and must be valid." },
        { status: 400 }
      );
    }

    // ✅ 5. Then create the challenge in DB
    const newChallenge = await prisma.challenge.create({
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

    // ✅ 6. Check the challenge is created in DB
    if (!newChallenge) {
      return NextResponse.json(
        { error: "Failed to create challenge in database." },
        { status: 500 }
      );
    }

    // ✅ 7. Send successful response with message
    return NextResponse.json(
      {
        message: "Challenge created successfully",
        data: newChallenge,
      },
      { status: 201 }
    );

  } catch (error: any) {
    const errMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Failed to create challenge:", errMessage);

    return NextResponse.json(
      { error: "Failed to create challenge." },
      { status: 500 }
    );
  }
}
