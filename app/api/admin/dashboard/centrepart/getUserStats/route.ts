import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET() {
  // Verify admin access
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get total user count
    const totalUsers = await prisma.user.count({
      where: { role: "USER" },
    });

    // Get recent signups (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: lastWeek } },
    });

    // Get blocked users count
    const blockedUsers = await prisma.user.count({
      where: { isBlocked: true },
    });

    return NextResponse.json(
      {
        totalUsers,
        recentSignups,
        blockedUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
