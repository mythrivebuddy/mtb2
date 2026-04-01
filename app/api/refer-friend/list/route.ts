import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "joinedAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const days = searchParams.get("days");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    let dateFilter: Prisma.DateTimeFilter | undefined;

    if (days) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - Number(days));
      dateFilter = { gte: fromDate };
    }

    if (from && to) {
      dateFilter = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const whereCondition: Prisma.UserWhereInput = {
      referredById: session.user.id,
      createdAt: dateFilter,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortField === "name") orderBy.name = sortDir as Prisma.SortOrder;
    else orderBy.createdAt = sortDir as Prisma.SortOrder;

    // Run queries in parallel
    const [referByActivity, total, referrals] = await Promise.all([
      prisma.activity.findUnique({
        where: { activity: "REFER_BY" },
        select: { jpAmount: true },
      }),
      prisma.user.count({ where: whereCondition }),
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const rewardAmount = referByActivity?.jpAmount || 0;

    return NextResponse.json(
      {
        referrals: referrals.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          avatar: r.image,
          joinedAt: r.createdAt,
          rewardEarned: rewardAmount,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
        { status: 200 }
    );
  } catch (error) {
    console.error("Referral list error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}