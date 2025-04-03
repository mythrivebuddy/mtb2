// /api/admin/dashboard/getAllUsers.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";

  // Verify admin access
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let whereClause = {};

  // Apply filters based on the query parameter
  if (filter === "blocked") {
    // Filter for blocked users (assuming a boolean field "isBlocked" exists)
    whereClause = { isBlocked: true, role: "USER" };
  } else if (filter === "new") {
    // Filter for new users (signed up within the last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    whereClause = { createdAt: { gte: oneWeekAgo }, role: "USER" };
  } else if (filter === "all") {
    whereClause = { role: "USER" };
  }

  // If a search term is provided, add a search filter (example: search in name or email)
  if (search.trim()) {
    whereClause = {
      ...whereClause,
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        jpEarned: true,
        jpBalance: true,
        createdAt: true,
        isBlocked: true,
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
