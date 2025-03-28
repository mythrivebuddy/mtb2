import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Verify admin access using getServerSession
  const session = await getServerSession(authConfig);

  // Verify admin access
  if (!session || session.user.role !== "USER") {
    //change it to admin
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Calculate the date 7 days ago
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Count users created in the last 7 days
    const count = await prisma.user.count({
      where: {
        createdAt: { gte: lastWeek },
      },
    });
    return NextResponse.json({ newSignupsLastWeek: count }, { status: 200 });
  } catch (error) {
    console.error("Error fetching new signups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
