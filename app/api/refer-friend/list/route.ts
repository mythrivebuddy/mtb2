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

    if (days && days !== "all") {
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
    const affiliate = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isAffiliate: true,
      },
    });

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortField === "name") orderBy.name = sortDir as Prisma.SortOrder;
    else orderBy.createdAt = sortDir as Prisma.SortOrder;

    // Run queries in parallel
    const [referByActivity, total, referrals, affiliateEarnings] =
      await Promise.all([
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
        affiliate?.isAffiliate
          ? prisma.affiliateEarningLedger.findMany({
              where: {
                affiliateId: session.user.id,
              },
              select: {
                id: true,
                referredUserId: true,
                earnedAmount: true,
                baseAmount: true,
                discountAmount: true,
                commissionRate: true,
                contextType: true,
                createdAt: true,
                currency: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const rewardAmount = referByActivity?.jpAmount || 0;
    const earningsMap = new Map<string, { INR: number; USD: number }>();

    affiliateEarnings.forEach((ae) => {
      const prev = earningsMap.get(ae.referredUserId) || {
        INR: 0,
        USD: 0,
      };

      const net = ae.earnedAmount || 0;

      if (ae.currency === "INR") {
        prev.INR += net;
      } else if (ae.currency === "USD") {
        prev.USD += net;
      }

      earningsMap.set(ae.referredUserId, {
        INR: Number(prev.INR.toFixed(2)),
        USD: Number(prev.USD.toFixed(2)),
      });
    });

    return NextResponse.json(
      {
        referrals: referrals.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          avatar: r.image,
          joinedAt: r.createdAt,
          rewardEarned: rewardAmount,
          commissionEarned: {
            INR: earningsMap.get(r.id)?.INR || 0,
            USD: earningsMap.get(r.id)?.USD || 0,
          },
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Referral list error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
