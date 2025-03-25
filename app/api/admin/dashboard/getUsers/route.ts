import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET() {
  // Verify admin access
  const session = await getServerSession(authConfig);

  // Verify admin access
  if (!session || session.user.role !== "USER") {
    //change it to admin
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Count users with role "USER"
    const count = await prisma.user.count({
      where: { role: "USER" },
    });
    return NextResponse.json({ totalActiveUsers: count });
  } catch (error) {
    console.error("Error fetching total active users:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
