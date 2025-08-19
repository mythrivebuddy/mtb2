// src/app/api/admin/dashboard/changeUserPlan/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";

// Use the exported PATCH function for the App Router
export async function PATCH(request: Request) {
  try {
    // 1. Secure the endpoint by checking for an admin session.
    const session = await getServerSession(authConfig);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission." },
        { status: 403 }
      );
    }

    // 2. Get the body from the request.
    const { userId, newPlanId } = await request.json();

    // 3. Validate the incoming request body.
    if (!userId || !newPlanId) {
      return NextResponse.json(
        { message: "Bad Request: Both 'userId' and 'newPlanId' are required." },
        { status: 400 }
      );
    }

    // 4. Perform the database update.
    await prisma.user.update({
      where: { id: userId },
      data: { planId: newPlanId },
    });

    // 5. Send a success response.
    return NextResponse.json({ message: "User plan updated successfully." });

  } catch (error) { // Type 'error' as 'unknown' by default
    console.error("API Error at changeUserPlan:", error);

    // Check if the error is an object with a 'code' property
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code: string }; // Safely cast to a known type
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { message: "Error: User with the provided ID was not found." },
          { status: 404 }
        );
      }
    }

    // For all other errors, send a generic server error message.
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}