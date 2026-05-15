import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { Prisma } from "@prisma/client";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type CreatorMapItem = {
  creatorId: string;
  currency: string;
  earned: number;
  commission: number;
  holding: number;
  baseAmount: number;
  discountAmount: number;
};

type AffiliateMapItem = {
  affiliateId: string;
  currency: string;
  earned: number;
  holding: number;
  baseAmount: number;
  discountAmount: number;
};

type CreatorPayout = {
  type: "CREATOR"; // 👈 differentiation
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string;
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

type AffiliatePayout = {
  type: "AFFILIATE"; // 👈 differentiation
  affiliateId: string;
  affiliate: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  currency: string;
  baseAmount: number;
  discountAmount: number;
  netAmount: number;
  payableAmount: number;
  holdingAmount: number;
};

export async function GET(req: NextRequest) {
  await checkRole("ADMIN");

  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const currency = searchParams.get("currency") || "ALL";

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const skip = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "payableAmount";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const holdingCutoff = new Date(
      Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    // ─────────────────────────────────────────────
    // WHERE CLAUSES
    // ─────────────────────────────────────────────

    const creatorWhere: Prisma.CreatorEarningLedgerWhereInput = {
      status: "PENDING",
      ...(currency !== "ALL" && { currency }),
      createdAt: {
        lte: holdingCutoff,
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    };

    const affiliateWhere: Prisma.AffiliateEarningLedgerWhereInput = {
      status: "PENDING",
      ...(currency !== "ALL" && { currency }),
      createdAt: {
        lte: holdingCutoff,
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    };

    // ─────────────────────────────────────────────
    // GROUPING
    // ─────────────────────────────────────────────

    const creatorGrouped = await prisma.creatorEarningLedger.groupBy({
      by: ["creatorId", "currency"],
      where: creatorWhere,
      _sum: {
        earnedAmount: true,
        platformFee: true,
        baseAmount: true,
        discountAmount: true,
      },
    });

    const creatorHolding = await prisma.creatorEarningLedger.groupBy({
      by: ["creatorId", "currency"],
      where: {
        status: "PENDING",
        ...(currency !== "ALL" && { currency }),
        createdAt: { gt: holdingCutoff },
      },
      _sum: {
        earnedAmount: true,
        platformFee: true,
        baseAmount: true,
        discountAmount: true,
      },
    });

    const affiliateGrouped = await prisma.affiliateEarningLedger.groupBy({
      by: ["affiliateId", "currency"],
      where: affiliateWhere,
      _sum: {
        earnedAmount: true,
        baseAmount: true,
        discountAmount: true,
      },
    });

    const affiliateHolding = await prisma.affiliateEarningLedger.groupBy({
      by: ["affiliateId", "currency"],
      where: {
        status: "PENDING",
        ...(currency !== "ALL" && { currency }),
        createdAt: { gt: holdingCutoff },
      },
      _sum: {
        earnedAmount: true,
        baseAmount: true,
        discountAmount: true,
      },
    });

    // ─────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────

    const creatorIds = [
      ...new Set([
        ...creatorGrouped.map((g) => g.creatorId),
        ...creatorHolding.map((h) => h.creatorId),
      ]),
    ];

    const affiliateIds = [
      ...new Set([
        ...affiliateGrouped.map((a) => a.affiliateId),
        ...affiliateHolding.map((a) => a.affiliateId),
      ]),
    ];

    const allUserIds = [...new Set([...creatorIds, ...affiliateIds])];

    const users = await prisma.user.findMany({
      where: {
        id: { in: allUserIds },
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

    // ─────────────────────────────────────────────
    // CREATOR MAP
    // ─────────────────────────────────────────────

    const creatorMap = new Map<string, CreatorMapItem>();

    creatorGrouped.forEach((g) => {
      const key = `${g.creatorId}-${g.currency}`;

      creatorMap.set(key, {
        creatorId: g.creatorId,
        currency: g.currency,
        earned: Number(g._sum.earnedAmount ?? 0),
        commission: Number(g._sum.platformFee ?? 0),
        holding: 0,
        baseAmount: Number(g._sum.baseAmount ?? 0),
        discountAmount: Number(g._sum.discountAmount ?? 0),
      });
    });

    creatorHolding.forEach((h) => {
      const key = `${h.creatorId}-${h.currency}`;
      const existing = creatorMap.get(key);

      if (existing) {
        existing.holding += Number(h._sum.earnedAmount ?? 0);
        existing.commission += Number(h._sum.platformFee ?? 0);
        existing.baseAmount += Number(h._sum.baseAmount ?? 0);
        existing.discountAmount += Number(h._sum.discountAmount ?? 0);
      } else {
        creatorMap.set(key, {
          creatorId: h.creatorId,
          currency: h.currency,
          earned: 0,
          commission: Number(h._sum.platformFee ?? 0),
          holding: Number(h._sum.earnedAmount ?? 0),
          baseAmount: Number(h._sum.baseAmount ?? 0),
          discountAmount: Number(h._sum.discountAmount ?? 0),
        });
      }
    });

    // ─────────────────────────────────────────────
    // AFFILIATE MAP
    // ─────────────────────────────────────────────

    const affiliateMap = new Map<string, AffiliateMapItem>();

    affiliateGrouped.forEach((a) => {
      const key = `${a.affiliateId}-${a.currency}`;

      affiliateMap.set(key, {
        affiliateId: a.affiliateId,
        currency: a.currency,
        earned: Number(a._sum.earnedAmount ?? 0),
        holding: 0,
        baseAmount: Number(a._sum.baseAmount ?? 0),
        discountAmount: Number(a._sum.discountAmount ?? 0),
      });
    });

    affiliateHolding.forEach((h) => {
      const key = `${h.affiliateId}-${h.currency}`;
      const existing = affiliateMap.get(key);

      if (existing) {
        existing.holding += Number(h._sum.earnedAmount ?? 0);
        existing.baseAmount += Number(h._sum.baseAmount ?? 0);
        existing.discountAmount += Number(h._sum.discountAmount ?? 0);
      } else {
        affiliateMap.set(key, {
          affiliateId: h.affiliateId,
          currency: h.currency,
          earned: 0,
          holding: Number(h._sum.earnedAmount ?? 0),
          baseAmount: Number(h._sum.baseAmount ?? 0),
          discountAmount: Number(h._sum.discountAmount ?? 0),
        });
      }
    });

    // ─────────────────────────────────────────────
    // FINAL ARRAYS
    // ─────────────────────────────────────────────

    const creators: CreatorPayout[] = Array.from(creatorMap.values())
      .map((item) => {
        const user = userMap.get(item.creatorId);
        if (!user) return null;

        return {
          type: "CREATOR",
          creatorId: item.creatorId,
          creator: user,
          currency: item.currency,
          baseAmount: item.baseAmount,
          discountAmount: item.discountAmount,
          netAmount: item.baseAmount - item.discountAmount,
          commissionAmount: item.commission,
          payableAmount: item.earned,
          holdingAmount: item.holding,
        };
      })
      .filter((r): r is CreatorPayout => r !== null);

    const affiliates: AffiliatePayout[] = Array.from(affiliateMap.values())
      .map((item) => {
        const user = userMap.get(item.affiliateId);
        if (!user) return null;

        return {
          type: "AFFILIATE",
          affiliateId: item.affiliateId,
          affiliate: user,
          currency: item.currency,
          baseAmount: item.baseAmount,
          discountAmount: item.discountAmount,
          netAmount: item.baseAmount - item.discountAmount,
          payableAmount: item.earned,
          holdingAmount: item.holding,
        };
      })
      .filter((r): r is AffiliatePayout => r !== null);

    // ─────────────────────────────────────────────
    // SORT (CREATORS ONLY)
    // ─────────────────────────────────────────────
    const combined = [...creators, ...affiliates];
    combined.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case "name":
          valA =
            a.type === "CREATOR"
              ? a.creator.name.toLowerCase()
              : a.affiliate.name.toLowerCase();

          valB =
            b.type === "CREATOR"
              ? b.creator.name.toLowerCase()
              : b.affiliate.name.toLowerCase();
          break;

        case "commissionAmount":
          valA = a.type === "CREATOR" ? a.commissionAmount : 0;
          valB = b.type === "CREATOR" ? b.commissionAmount : 0;
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

        case "payableAmount":
          valA = a.payableAmount;
          valB = b.payableAmount;
          break;

        case "holdingAmount":
          valA = a.holdingAmount;
          valB = b.holdingAmount;
          break;

        default:
          valA = a.payableAmount;
          valB = b.payableAmount;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = combined.length;
const paginated = combined.slice(skip, skip + limit);

    // ─────────────────────────────────────────────
    // ANALYTICS
    // ─────────────────────────────────────────────

    const analytics = {
      creator: {
        totalPayable: 0,
        totalHolding: 0,
        totalCommission: 0,
      },
      affiliate: {
        totalPayable: 0,
        totalHolding: 0,
      },
    };

    creators.forEach((r) => {
      analytics.creator.totalPayable += r.payableAmount;
      analytics.creator.totalHolding += r.holdingAmount;
      analytics.creator.totalCommission += r.commissionAmount;
    });

    affiliates.forEach((r) => {
      analytics.affiliate.totalPayable += r.payableAmount;
      analytics.affiliate.totalHolding += r.holdingAmount;
    });

    // ─────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────

    return NextResponse.json({
      payouts: paginated, 
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
