import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Verify admin access using getServerSession
  const session = await getServerSession(authConfig);

  // Verify admin access
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Count spotlight applications
    const spotlightCount = await prisma.spotlight.count({
      where: {
        status: "APPLIED", // Only count applications that are in APPLIED status
      },
    });

    return NextResponse.json(
      { spotlightRequests: spotlightCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching spotlight request count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
