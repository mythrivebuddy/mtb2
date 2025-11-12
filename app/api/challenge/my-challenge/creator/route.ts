// api/challenge/my-challenge/creator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const DELETE = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const userId = searchParams.get("userId");
    const userName = searchParams.get("user_name");

    if (!challengeId || !userId) {
      return NextResponse.json(
        { message: "Challenge ID and User ID are required" },
        { status: 400 }
      );
    }

    // Delete the enrollment for that user in that challenge
    await prisma.challengeEnrollment.delete({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });

    return NextResponse.json(
      { message: `${userName} removed from challenge successfully`,success:true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);

    // Handle case where the enrollment doesn’t exist
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};
