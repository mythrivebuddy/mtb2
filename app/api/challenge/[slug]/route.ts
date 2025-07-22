import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ FIX 1: Use the shared Prisma instance

/**
 * @brief Handles GET requests to fetch a single challenge by its combined slug and UUID.
 * * This API route expects a dynamic segment in the URL like `[slug]`
 * where the slug contains the challenge title and ID combined with hyphens.
 * For example: /api/challenge/my-challenge-title-cuid12345
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const fullSlug = (await params).slug;

    if (!fullSlug) {
      return NextResponse.json(
        { success: false, message: "Challenge identifier missing." },
        { status: 400 }
      );
    }

    // Extract the UUID from the end of the full slug string
    const parts = fullSlug.split('-');
    const uuid = parts[parts.length - 1];

    if (!uuid) {
        return NextResponse.json(
            { success: false, message: "Invalid challenge link format." },
            { status: 400 }
        );
    }
    
    // ✅ FIX 2: Correct the Prisma query to only find by the unique ID.
    const challenge = await prisma.challenge.findUnique({
      where: {
        id: uuid, 
      },
      select: { // Use select to only get the data you need for this page
        id: true,
        slug: true,
        title: true,
        description: true,
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, message: "Challenge not found." },
        { status: 404 }
      );
    }

    // Return the fetched challenge data in the format the client expects
    return NextResponse.json({ success: true, challenge: challenge }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch challenge:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}