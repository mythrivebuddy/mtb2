import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { Prisma } from "@prisma/client";

type CreatorPayout = {
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string; // ✅ FIXED
  };
  currency: string;
  baseAmount: number;
  discountAmount: number;
  commissionAmount: number;
  payableAmount: number;
};

export async function GET(req: NextRequest) {
  await checkRole("ADMIN");

  try {
    const { searchParams } = new URL(req.url);

    // ─────────────────────────────────────────────
    // 1. Query params
    // ─────────────────────────────────────────────
    const search = searchParams.get("search") || "";
    const currency = searchParams.get("currency") || "ALL";

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const skip = (page - 1) * limit;

    // ─────────────────────────────────────────────
    // 2. Build where clause
    // ─────────────────────────────────────────────

    const where: Prisma.CreatorEarningLedgerWhereInput = {
      status: "PENDING",
    };

    if (currency !== "ALL") {
      where.currency = currency;
    }

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // ─────────────────────────────────────────────
    // 3. GroupBy (core aggregation)
    // ─────────────────────────────────────────────
    const grouped = await prisma.creatorEarningLedger.groupBy({
      by: ["creatorId", "currency"],
      where,
      _sum: {
        earnedAmount: true,
        platformFee: true,
      },
      orderBy: {
        _sum: {
          earnedAmount: "desc",
        },
      },
    });

    // ─────────────────────────────────────────────
    // 4. Attach user data
    // ─────────────────────────────────────────────
    const creatorIds = [...new Set(grouped.map((g) => g.creatorId))];

    const users = await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // ─────────────────────────────────────────────
    // 5. Merge + filter (search-safe)
    // ─────────────────────────────────────────────
    let result = grouped
      .map((g) => {
        const user = userMap.get(g.creatorId);
        if (!user) return null;

        const earnedAmount = Number(g._sum.earnedAmount ?? 0);
        const platformFee = Number(g._sum.platformFee ?? 0);

        return {
          creatorId: g.creatorId,
          creator: user,
          currency: g.currency,
          baseAmount: earnedAmount + platformFee,
          discountAmount: 0,
          commissionAmount: platformFee,
          payableAmount: earnedAmount,
        };
      })
      .filter((r): r is CreatorPayout => r !== null);

    // 🔍 Extra safety (search filter if user not matched in DB query)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.creator.name?.toLowerCase().includes(q) ||
          r.creator.email?.toLowerCase().includes(q),
      );
    }

    // ─────────────────────────────────────────────
    // 6. Pagination (AFTER aggregation)
    // ─────────────────────────────────────────────
    const total = result.length;
    const paginated = result.slice(skip, skip + limit);

    // ─────────────────────────────────────────────
    // 7. Response
    // ─────────────────────────────────────────────
    return NextResponse.json({
      creators: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[PAYOUTS_GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 },
    );
  }
}
