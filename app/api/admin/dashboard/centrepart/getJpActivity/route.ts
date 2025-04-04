import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET() {
  const session = await getServerSession(authConfig);

  // Verify admin access
  if (!session || session.user.role !== "ADMIN") {
    //change it to admin
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const totals = await prisma.user.aggregate({
      _sum: {
        jpEarned: true,
        jpSpent: true,
        jpBalance: true,
      },
      where: { role: "USER" },
    });

    return NextResponse.json({
      totalJpDistributed: totals._sum.jpEarned || 0,
      totalJpSpent: totals._sum.jpSpent || 0,
      totalJpBalance: totals._sum.jpBalance || 0,
    });
  } catch (error) {
    console.error("Error fetching JP totals:", error);
    return NextResponse.json(
      { message: "Error fetching JP totals" },
      { status: 500 }
    );
  }
}
