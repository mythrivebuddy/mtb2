import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

/**
 * Handles GET requests to fetch the data for a single challenge,
 * specifically for populating the edit form.
 * It verifies that the user is the creator of the challenge.
 */
export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    if (!challengeId || typeof challengeId !== "string") {
      return NextResponse.json(
        { error: "A valid challenge ID is required." },
        { status: 400 }
      );
    }

    // Fetch the challenge and verify ownership.
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    // Ensure only the creator can fetch the data for editing.
    if (challenge.creatorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit challenges you created." },
        { status: 403 }
      );
    }
    
    // Manually serialize the challenge object to handle Date fields.
    const serializableChallenge = {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
    };

    return NextResponse.json(serializableChallenge);

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `GET /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage
    );
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to remove a challenge.
 * (This function remains unchanged)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete challenges you created" },
        { status: 403 }
      );
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    return NextResponse.json(
      { message: "Challenge deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `DELETE /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing challenge.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug: challengeId } = context.params;

  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const challengeToUpdate = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { creatorId: true },
    });

    if (!challengeToUpdate) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challengeToUpdate.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit challenges you created" },
        { status: 403 }
      );
    }

    // --- FIX for PRISMA ERROR ---
    // Destructure the body to only include fields that exist in the Challenge model.
    const {
        title,
        description,
        reward,
        penalty,
        startDate,
        endDate,
        mode
    } = body;

    // Create a new data object with correct types for Prisma.
    const updateData = {
      title,
      description,
      reward,
      penalty,
      mode,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });

    // Also serialize the response here to prevent errors after updating.
    const serializableUpdatedChallenge = {
        ...updatedChallenge,
        startDate: updatedChallenge.startDate.toISOString(),
        endDate: updatedChallenge.endDate.toISOString(),
        createdAt: updatedChallenge.createdAt.toISOString(),
    };

    return NextResponse.json(
      { message: "Challenge updated successfully", data: serializableUpdatedChallenge },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `PATCH /api/challenge/my-challenge/${challengeId} Error:`,
      errorMessage,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
