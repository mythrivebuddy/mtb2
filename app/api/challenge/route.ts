import { checkRole } from "@/lib/utils/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { challengeSchema } from "@/schema/zodSchema"; // Assuming you have a Zod schema for validation

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
    const userId = session.user.id;

    // 2. Parse the request body
    const body = await request.json();

    // 3. Validate the incoming data using your Zod schema
    const validationResult = challengeSchema.safeParse(body);
    if (!validationResult.success) {
      // If validation fails, return a detailed error response
      return NextResponse.json(
        { error: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
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

    // 4. Create the new challenge and its associated "template" tasks in the database
    // This logic is correct for the streak-based schema. We create the challenge
    // and its shared ChallengeTask templates in a single transaction.
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
        status: "UPCOMING", // Default status for a new challenge
        creatorId: userId, // Explicitly link the creator's ID
        
        // This nested "create" operation is the key.
        // It creates the ChallengeTask records and automatically links them
        // to this new challenge. These are the shared templates.
        templateTasks: {
          create: tasks.map((task) => ({
            description: task.description,
          })),
        },
      },
      // Include the created tasks in the response for confirmation
      include: {
        templateTasks: true,
      },
    });

    // 5. Send a successful response
    return NextResponse.json(
      {
        message: "Challenge created successfully!",
        data: newChallenge,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("Failed to create challenge:", error);

    // Return a generic server error response
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
