import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @brief Handles GET requests to fetch a single challenge by its combined slug and UUID.
 *
 * This API route expects a dynamic segment in the URL like `[slug]-[uuid]`.
 * For example: `/api/challenge/my-fitness-challenge-cuid12345abcdef`
 *
 * @param request The incoming Next.js Request object.
 * @param params An object containing the dynamic route parameters.
 * Expected to have `slug_uuid` which is the combined slug and UUID string.
 * @returns A NextResponse containing the challenge data or an error.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug_uuid: string } }
) {
  try {
    const { slug_uuid } = await params;

    if (!slug_uuid) {
      return NextResponse.json(
        { message: "Challenge identifier missing." },
        { status: 400 }
      );
    }

    // Split the combined slug_uuid to extract the slug and the UUID.
    // We assume the UUID is always at the end after the last hyphen.
    const parts = slug_uuid.split('-');
    if (parts.length < 2) {
      return NextResponse.json(
        { message: "Invalid challenge link format." },
        { status: 400 }
      );
    }

    const uuid = parts[parts.length - 1]; // The last part is the UUID
    const slug = parts.slice(0, -1).join('-'); // The rest is the slug

    // Fetch the challenge from the database using both ID and slug for robustness
    const challenge = await prisma.challenge.findUnique({
      where: {
        id: uuid,
        slug: slug,
      },
      include: {
        templateTasks: {
          select: {
            id: true,
            description: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        // You might want to include enrollments or other related data based on your needs
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found." },
        { status: 404 }
      );
    }

    // Return the fetched challenge data
    return NextResponse.json({ success: true, challenge }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch challenge:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while fetching the challenge." },
      { status: 500 }
    );
  }
}
