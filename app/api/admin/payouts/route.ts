import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { Prisma } from "@prisma/client";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";

type CreatorPayout = {
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string; // ✅ FIXED
    image: string | null;
  };
  currency: string;
  baseAmount: number;
  discountAmount: number;
  netAmount: number;
  commissionAmount: number;
  payableAmount: number;
  holdingAmount: number;
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
    const sortBy = searchParams.get("sortBy") || "payableAmount";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // ─────────────────────────────────────────────
    // 2. Build where clause
    // ─────────────────────────────────────────────

    const holdingCutoff = new Date(
      Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const where: Prisma.CreatorEarningLedgerWhereInput = {
      status: "PENDING",

      ...(currency !== "ALL" && { currency }),

      createdAt: {
        lte: holdingCutoff,
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    };

    // ─────────────────────────────────────────────
    // 3. GroupBy (core aggregation)
    // ─────────────────────────────────────────────
    const grouped = await prisma.creatorEarningLedger.groupBy({
      by: ["creatorId", "currency"],
      where,
      _sum: {
        earnedAmount: true,
        platformFee: true,
        baseAmount: true,
        discountAmount: true,
      },
    });
    // In the grouped query, also fetch individual records to check holding
    const pendingInHold = await prisma.creatorEarningLedger.groupBy({
      by: ["creatorId", "currency"],
      where: {
        status: "PENDING",

        ...(currency !== "ALL" && { currency }),
        createdAt: {
          gt: new Date(Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        earnedAmount: true,
        platformFee: true,
        baseAmount: true,
        discountAmount: true,
      },
    });

    // ─────────────────────────────────────────────
    // 4. Attach user data
    // ─────────────────────────────────────────────
    const creatorIds = [
      ...new Set([
        ...grouped.map((g) => g.creatorId),
        ...pendingInHold.map((h) => h.creatorId), // ✅ include holding users
      ]),
    ];

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
        image: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const payoutMap = new Map<
      string,
      {
        creatorId: string;
        currency: string;
        earned: number;
        commission: number;
        holding: number;
        baseAmount: number;
        discountAmount: number;
      }
    >();
    grouped.forEach((g) => {
      const key = `${g.creatorId}-${g.currency}`;

      payoutMap.set(key, {
        creatorId: g.creatorId,
        currency: g.currency,
        earned: Number(g._sum.earnedAmount ?? 0),
        commission: Number(g._sum.platformFee ?? 0),
        holding: 0,
        baseAmount: Number(g._sum.baseAmount ?? 0),
        discountAmount: Number(g._sum.discountAmount ?? 0),
      });
    });
    pendingInHold.forEach((h) => {
      const key = `${h.creatorId}-${h.currency}`;
      const existing = payoutMap.get(key);

      const holdingEarned = Number(h._sum.earnedAmount ?? 0);
      const holdingCommission = Number(h._sum.platformFee ?? 0);
      const holdingBase = Number(h._sum.baseAmount ?? 0);
      const holdingDiscount = Number(h._sum.discountAmount ?? 0);

      if (existing) {
        existing.holding += holdingEarned; // changed to += for safety
        // existing.earned += 0; // keep payable clean
        existing.commission += holdingCommission;
        existing.baseAmount += holdingBase;
        existing.discountAmount += holdingDiscount;
      } else {
        payoutMap.set(key, {
          creatorId: h.creatorId,
          currency: h.currency,
          earned: 0, // ✅ FIXED: Must be 0 so holding money doesn't become payable
          commission: holdingCommission,
          holding: holdingEarned,
          baseAmount: holdingBase,
          discountAmount: holdingDiscount,
        });
      }
    });
    // ─────────────────────────────────────────────
    // 5. Merge + filter (search-safe)
    // ─────────────────────────────────────────────
    let result = Array.from(payoutMap.values())
      .map((item) => {
        const user = userMap.get(item.creatorId);
        if (!user) return null;

        return {
          creatorId: item.creatorId,
          creator: user,
          currency: item.currency,
          baseAmount: item.baseAmount,
          discountAmount: item.discountAmount, //  ASSIGN REAL DISCOUNT
          netAmount: item.baseAmount - item.discountAmount,
          commissionAmount: item.commission,
          payableAmount: item.earned,
          holdingAmount: item.holding,
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
    const analytics = {
      totalPayableINR: 0,
      totalPayableUSD: 0,
      totalHoldingINR: 0,
      totalHoldingUSD: 0,
      totalCommission: 0,
    };

    result.forEach((r) => {
      if (r.currency === "INR") {
        analytics.totalPayableINR += r.payableAmount;
        analytics.totalHoldingINR += r.holdingAmount;
      }

      if (r.currency === "USD") {
        analytics.totalPayableUSD += r.payableAmount;
        analytics.totalHoldingUSD += r.holdingAmount;
      }

      analytics.totalCommission += r.commissionAmount;
    });

    result.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case "creatorName":
          valA = a.creator.name.toLowerCase();
          valB = b.creator.name.toLowerCase();
          break;

        case "baseAmount":
          valA = a.baseAmount;
          valB = b.baseAmount;
          break;

        case "discountAmount":
          valA = a.discountAmount;
          valB = b.discountAmount;
          break;

        case "netAmount":
          valA = a.netAmount;
          valB = b.netAmount;
          break;

        case "commissionAmount":
          valA = a.commissionAmount;
          valB = b.commissionAmount;
          break;

        case "pendingBalance":
          valA = a.payableAmount;
          valB = b.payableAmount;
          break;

        default:
          valA = a.payableAmount;
          valB = b.payableAmount;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

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
      analytics,
    });
  } catch (err) {
    console.error("[PAYOUTS_GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 },
    );
  }
}
