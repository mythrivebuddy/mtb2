// /api/admin/dashboard/getAllUsers.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { PlanUserType, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);

  // ADDED: New filters
  const userType = searchParams.get("userType") || "all";
  const planType = searchParams.get("planType") || "all";
  const programType = searchParams.get("programType") || "all";

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Verify admin access
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // BASE where clause (always applied)
  const whereClause: Prisma.UserWhereInput = {
  role: "USER",
};


  // Apply filters based on the query parameter
  if (filter === "blocked") {
    whereClause.isBlocked = true;
  } else if (filter === "new") {
    // Filter for new users (signed up within the last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    whereClause.createdAt = { gte: oneWeekAgo };
  }
  // else if (filter === "online") {
  //   whereClause.isOnline = true;
  // }

 // Filter: blocked / new
if (filter === "blocked") {
  whereClause.isBlocked = true;
} else if (filter === "new") {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  whereClause.createdAt = { gte: oneWeekAgo };
}

// User type
if (userType !== "all") {
  whereClause.userType = userType.toUpperCase() as PlanUserType;
}

// Plan type
if (planType === "free") {
  // whereClause.plan = null; // Not using temperarily
  whereClause.membership = "FREE";
} else if (planType === "paid") {
  // whereClause.plan = { isNot: null }; // Not using temperarily
  whereClause.membership = "PAID";
}

// Program type
let programId: string | null = null;

if (programType !== "all" && programType !== "none") {
  const program = await prisma.program.findUnique({
    where: { slug: programType },
    select: { id: true },
  });

  programId = program?.id ?? null;
}
// Program filter (one-time paid programs)

// ALL → no program filter applied
if (programType === "all") {
  // intentionally empty
}

// ANY → users with at least one paid program
else if (programType === "any") {
  whereClause.oneTimePurchases = {
    some: {
      status: "PAID",
    },
  };
}

// NONE → users with no paid program
else if (programType === "none") {
  whereClause.oneTimePurchases = {
    none: {
      status: "PAID",
    },
  };
}

// SPECIFIC PROGRAM (by slug)
else if (programId) {
  whereClause.oneTimePurchases = {
    some: {
      status: "PAID",
      productId: programId,
    },
  };
}


// if (programType === "cmp") {
//   whereClause.oneTimePurchases = { some: {} };
// } else if (programType === "none") {
//   whereClause.programStates = { none: {} };
// }

// Search
if (search.trim()) {
  whereClause.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ];
}

  // If a search term is provided, add a search filter (example: search in name or email)
  if (search.trim()) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        jpEarned: true,
        jpBalance: true,
        createdAt: true,
        isBlocked: true,
        isOnline: true,
        image: true,
        userType: true,
        membership: true,
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    return NextResponse.json({
      users,
      total: totalUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}