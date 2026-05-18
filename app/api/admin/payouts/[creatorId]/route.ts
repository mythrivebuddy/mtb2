import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { HOLDING_PERIOD_DAYS } from "@/lib/constant";

export async function GET(
  req: Request,
  { params }: { params: { creatorId: string } },
) {
  await checkRole("ADMIN");
  const paramsContext = await params
  const creatorId =  paramsContext.creatorId;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // CREATOR | AFFILIATE
  const currency = searchParams.get("currency"); // INR | USD | ALL | null
  const statusParam = searchParams.get("status"); // PAID | MATURED | HOLDING | ALL | null
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Number(searchParams.get("limit") || 10));
  const skip = (page - 1) * limit;

  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  const holdingCutoff = new Date(
    Date.now() - HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );

  // ─── Status filter ────────────────────────────────────────────────────────
  // MATURED / HOLDING are derived from PENDING + createdAt, not a DB column.
  // PAID maps directly to status === "PAID".
  const statusWhere: Record<string, unknown> =
    statusParam === "PAID"
      ? { status: "PAID" }
      : statusParam === "MATURED"
        ? { status: "PENDING", createdAt: { lte: holdingCutoff } }
        : statusParam === "HOLDING"
          ? { status: "PENDING", createdAt: { gt: holdingCutoff } }
          : {}; // ALL — no status filter

  // ─── Date range filter ────────────────────────────────────────────────────
  const dateWhere =
    fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate
              ? {
                  lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
                }
              : {}),
          },
        }
      : {};

  // ─── Currency filter ──────────────────────────────────────────────────────
  // Ignore "ALL" or null — don't pass it into Prisma as a literal value.
  const currencyWhere =
    currency && currency !== "ALL" ? { currency } : {};

  const baseWhere = {
    ...currencyWhere,
    ...statusWhere,
    ...dateWhere,
  };

  // ─── Fetch creator ────────────────────────────────────────────────────────
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { name: true, email: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const isAffiliate = type === "AFFILIATE";

  // ─── Shared paymentOrder include ──────────────────────────────────────────
  const paymentOrderInclude = {
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true } },
      challenge: { select: { title: true } },
   
      storeOrder: {
        include: {
          items: {
            include: { item: { select: { name: true } } },
          },
        },
      },
    },
  };

  // ─── Fetch earnings ───────────────────────────────────────────────────────
  const earnings = isAffiliate
    ? await prisma.affiliateEarningLedger.findMany({
        where: { affiliateId: creatorId, ...baseWhere },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { paymentOrder: paymentOrderInclude },
      })
    : await prisma.creatorEarningLedger.findMany({
        where: { creatorId, ...baseWhere },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { paymentOrder: paymentOrderInclude },
      });

  // ─── Total count (same where, no skip/take) ───────────────────────────────
  const totalCount = isAffiliate
    ? await prisma.affiliateEarningLedger.count({
        where: { affiliateId: creatorId, ...baseWhere },
      })
    : await prisma.creatorEarningLedger.count({
        where: { creatorId, ...baseWhere },
      });

  const totalPages = Math.ceil(totalCount / limit);
  const allEarnings = isAffiliate
  ? await prisma.affiliateEarningLedger.findMany({
      where: { affiliateId: creatorId, ...baseWhere },
      select: {
        earnedAmount: true,
        status: true,
        createdAt: true,
      },
    })
  : await prisma.creatorEarningLedger.findMany({
      where: { creatorId, ...baseWhere },
      select: {
        earnedAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const analytics = allEarnings.reduce(
  (acc, e) => {
    const amount = Number(e.earnedAmount || 0);

    if (e.status === "PAID") {
      acc.paid += amount;
    } else if (e.status === "PENDING") {
      if (e.createdAt <= holdingCutoff) {
        acc.matured += amount;
      } else {
        acc.holding += amount;
      }
    }

    acc.total += amount;

    return acc;
  },
  {
    total: 0,
    paid: 0,
    matured: 0,
    holding: 0,
  },
);

  // ─── Resolve program names ────────────────────────────────────────────────
  const programIds = earnings
    .map((e) => e.paymentOrder?.programId)
    .filter((id): id is string => Boolean(id));

  const programMap = new Map<string, string>();

  if (programIds.length) {
    const programs = await prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true, name: true },
    });
    programs.forEach((p) => programMap.set(p.id, p.name));
  }

  // ─── Format output ────────────────────────────────────────────────────────
  const formatted = earnings.map((e) => {
    const discountApplied = Number(e.paymentOrder?.discountApplied ?? 0);
    const baseAmount = Number(e.baseAmount ?? 0);
    const netAmount = Math.max(baseAmount - discountApplied, 0);

    const isHolding = e.status === "PENDING" && e.createdAt > holdingCutoff;
    const isMatured = e.status === "PENDING" && e.createdAt <= holdingCutoff;

    const platformFee = isAffiliate
      ? 0
      : Number(("platformFee" in e ? e.platformFee : null) ?? 0);

    const itemName =
      e.paymentOrder?.plan?.name ||
      e.paymentOrder?.challenge?.title ||
      (e.paymentOrder?.programId
        ? programMap.get(e.paymentOrder.programId)
        : undefined) ||
      e.paymentOrder?.storeOrder?.items?.[0]?.item?.name ||
      "Unknown Item";

    return {
      ...e,
      baseAmount,
      netAmount,
      discountApplied,
      platformFee,
      isHolding,
      isMatured,
      buyerName: e.paymentOrder?.user?.name || "Unknown Buyer",
      buyerEmail: e.paymentOrder?.user?.email || "N/A",
      itemName,
    };
  });

  return NextResponse.json({
    creator,
    earnings: formatted,
    analytics,
    pagination: {
      page,
      limit,
      totalPages,
      totalCount,
    },
  });
}