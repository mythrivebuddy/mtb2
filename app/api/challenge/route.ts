/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRole } from "@/lib/utils/auth";
import { PrismaClient, ChallengeMode } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// A simple function to generate a URL-friendly slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

// Define the shape of the incoming request body for type safety
interface CreateChallengeBody {
  title: string;
  description?: string;
  mode: ChallengeMode;
  cost: number;
  reward: number;
  penalty: number;
  startDate: string;
  endDate: string;
  tasks?: { description: string }[];
}

// Export a named function for the POST method
export async function POST(request: Request) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user.id;

    const {
      title,
      description,
      mode,
      startDate,
      endDate,
      tasks,
    }: CreateChallengeBody = await request.json();

    // --- 1. Authentication (Placeholder) ---
    // In a real app, you'd get the user ID from a session or JWT token.
    //const userId = 'clwqk4x70000008l4g9f8h3b1'; // Replace with actual authenticated user ID

    console.log(
      `title : ${title} description : ${description} mode : ${mode} startDate : ${startDate} endDate : ${endDate} Task : ${tasks}`
    );

    // --- 2. Validation ---
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, startDate, and endDate are required." },
        { status: 400 }
      );
    }

    // --- 3. Create the Challenge ---
    const newChallenge = await prisma.challenge.create({
      data: {
        title,
        slug: generateSlug(title),
        description,
        mode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "UPCOMING",
        creator: {
          connect: { id: userId },
        },
        tasks: {
          create:
            tasks?.map((task) => ({ description: task.description })) || [],
        },
      },
    });

    // --- 4. Send Success Response ---
    return NextResponse.json(newChallenge, { status: 201 });
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
