import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import {
  activityDisplayMap,
  activityDisplayMapV3,
} from "@/lib/constants/activityNames";
import { PaymentStatus } from "@prisma/client";
import { getCommissionPercent } from "@/lib/commission/getCommissionPercent";
import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";

type TransactionMetadata = {
  joinerName?: string;
  challengeTitle?: string;
  items?: {
    name: string;
    itemId: string;
  }[];
};
// 🔹 helper type for cart items
type CartItem = {
  itemId: string;
  name: string;
  quantity?: number;
  price: number;
  discount?: number;
};

// 🔹 safe JSON parser
function parseCartSnapshot(snapshot: unknown): CartItem[] {
  if (!snapshot) return [];

  if (typeof snapshot === "string") {
    try {
      return JSON.parse(snapshot) as CartItem[];
    } catch {
      return [];
    }
  }

  if (Array.isArray(snapshot)) {
    return snapshot as CartItem[];
  }

  return [];
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "7");
  const filter = searchParams.get("filter") || "ALL";
  const currency = searchParams.get("currency") || "ALL";
  // const skip = (page - 1) * limit;
  const txType = searchParams.get("txType") || "ALL";

  // ✅ Determine version flag
  const versionFlag =
    searchParams.get("version") === "v3" || searchParams.get("v3") === "true";

  // ✅ Pick correct map
  const displayMap = versionFlag ? activityDisplayMapV3 : activityDisplayMap;

  const session = await checkRole("USER");
  const userId = session.user.id;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  // const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  try {
    const userType = normalizeUserType(session.user.userType);
    if (!userType || !session.user.membership) {
      return NextResponse.json(
        { error: "Invalid user type or membership" },
        { status: 400 },
      );
    }

    const [challengeCommission, mmpCommission, storeCommission] =
      await Promise.all([
        getCommissionPercent({
          feature: "challenges",
          userType,
          membership: session.user.membership,
        }),
        getCommissionPercent({
          feature: "miniMasteryPrograms",
          userType,
          membership: session.user.membership,
        }),
        getCommissionPercent({
          feature: "store", // ✅ IMPORTANT
          userType,
          membership: session.user.membership,
        }),
      ]);

    const coachChallengeEarningsPromise =
      filter === "ALL" || filter === "COACH_EARNING" || filter === "CHALLENGE"
        ? prisma.challengePayment.findMany({
            where: {
              status: PaymentStatus.PAID,
              challenge: {
                creatorId: userId, // coach owns the challenge
              },
            },
            include: {
              challenge: true,
              user: true, // the participant
              paymentOrder: true,
            },
          })
        : Promise.resolve([]);

    const mmpOrders = await prisma.paymentOrder.findMany({
      where: {
        status: PaymentStatus.PAID,
        contextType: "MMP_PROGRAM",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    const mmpProgramIds = mmpOrders
      .map((o) => o.programId)
      .filter((id): id is string => !!id); // ✅ fixes null issue too

    const mmpPrograms = await prisma.program.findMany({
      where: {
        id: { in: mmpProgramIds },
      },
      select: {
        id: true,
        name: true,
        createdBy: true, // 👈 FIXED (see next issue)
      },
    });

    const mmpProgramMap = new Map(mmpPrograms.map((p) => [p.id, p]));

    const coachMmpEarnings = await Promise.all(
      mmpOrders
        .filter((po) => {
          const program = mmpProgramMap.get(po.programId!);
          return program?.createdBy === userId;
        })
        .map(async (po) => {
          const program = mmpProgramMap.get(po.programId!);
          const commissionPercent = mmpCommission;
          const baseAmount = po.baseAmount ?? po.totalAmount;
          const discount = po.discountApplied ?? 0;

          const netBase = baseAmount - discount;

          const commission = (netBase * commissionPercent) / 100;
          const finalAmount = netBase - commission;
          return {
            id: `mmp-${po.id}`,
            createdAt: po.paidAt || po.createdAt,
            jpAmount: finalAmount,
            currency: po.currency,
            breakdown: {
              baseAmount,
              commission,
              finalAmount,
              discount,
            },
            activity: {
              activity: "MMP_EARNING",
              transactionType: "CREDIT",
              displayName: `${po.user?.name} joined ${program?.name}`,
            },
            activityMeta: {
              joinerId: po.user?.id,
              joinerName: po.user?.name,
              programId: po.programId,
              programName: program?.name,
            },
          };
        }),
    );

    const paymentOrdersPromise =
      filter === "ALL" ||
      filter === "SUBSCRIPTION" ||
      filter === "STORE_PRODUCT" ||
      filter === "MMP"
        ? prisma.paymentOrder.findMany({
            where: {
              userId,
              status: PaymentStatus.PAID,
              ...(filter !== "ALL" && {
                contextType:
                  filter === "SUBSCRIPTION"
                    ? "SUBSCRIPTION"
                    : filter === "STORE_PRODUCT"
                      ? "STORE_PRODUCT"
                      : filter === "MMP"
                        ? "MMP_PROGRAM"
                        : undefined,
              }),
            },
            include: {
              plan: true,
              challenge: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]);

    const storeOrdersPromise = prisma.paymentOrder.findMany({
      where: {
        status: PaymentStatus.PAID,
        contextType: "STORE_PRODUCT",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const affiliateEarningsPromise = prisma.affiliateEarningLedger.findMany({
      where: {
        affiliateId: userId,
      },
      include: {
        referredUser: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const [
      user,
      transactions,
      paymentOrders,
      storeOrders,
      coachChallengeEarnings,
      affiliateEarnings,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          jpBalance: true,
        },
      }),
      filter === "ALL" ||
      filter === "GP" ||
      filter === "CHALLENGE" ||
      filter === "STORE_PRODUCT"
        ? // || filter === "MMP"
          prisma.transaction.findMany({
            where: {
              userId,
              ...(filter === "CHALLENGE" && {
                activity: {
                  activity: {
                    in: [
                      "CHALLENGE_JOINING_FEE",
                      "CHALLENGE_FEE_EARNED",
                      "CHALLENGE_PENALTY",
                      "CHALLENGE_REWARD",
                      "CHALLENGE_CREATION_FEE",
                    ],
                  },
                },
              }),
              ...(filter === "STORE_PRODUCT" && {
                activity: {
                  activity: {
                    in: ["STORE_PURCHASE", "STORE_SALE"],
                  },
                },
              }),
            },
            include: { activity: true },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      paymentOrdersPromise,
      storeOrdersPromise,
      coachChallengeEarningsPromise,
      affiliateEarningsPromise,
    ]);
    const affiliateOrderIds = affiliateEarnings.map((ae) => ae.paymentOrderId);

    const affiliateOrders = await prisma.paymentOrder.findMany({
      where: {
        id: { in: affiliateOrderIds },
      },
      select: {
        id: true,
        programId: true,
        challengeId: true, // ✅ ADD
        cartSnapshot: true, // ✅ ADD
      },
    });

    const affiliateOrderMap = new Map(affiliateOrders.map((o) => [o.id, o]));
    const affiliateChallengeIds = affiliateOrders
      .map((o) => o.challengeId)
      .filter((id): id is string => !!id);

    const affiliateChallenges = await prisma.challenge.findMany({
      where: { id: { in: affiliateChallengeIds } },
      select: { id: true, title: true },
    });

    const affiliateChallengeMap = new Map(
      affiliateChallenges.map((c) => [c.id, c.title]),
    );

    const affiliateItemIds = affiliateOrders.flatMap((o) => {
      if (!o.cartSnapshot) return [];
      const items = parseCartSnapshot(o.cartSnapshot);
      return items.map((i) => i.itemId);
    });

    const affiliateProducts = await prisma.item.findMany({
      where: { id: { in: affiliateItemIds } },
      select: { id: true, name: true },
    });

    const affiliateProductMap = new Map(
      affiliateProducts.map((p) => [p.id, p.name]),
    );
    const affiliateProgramIds = affiliateOrders
      .map((o) => o.programId)
      .filter((id): id is string => !!id);

    const affiliatePrograms = await prisma.program.findMany({
      where: { id: { in: affiliateProgramIds } },
      select: { id: true, name: true },
    });

    const affiliateProgramMap = new Map(
      affiliatePrograms.map((p) => [p.id, p.name]),
    );

    const storeItemIds = storeOrders
      .filter((po) => po.contextType === "STORE_PRODUCT")
      .flatMap((po) => {
        const items = parseCartSnapshot(po.cartSnapshot);
        return items.map((item) => item.itemId);
      })
      .filter((id): id is string => Boolean(id));

    const storeProducts = await prisma.item.findMany({
      where: {
        id: { in: storeItemIds },
      },
    });

    const coachStoreEarnings = await Promise.all(
      storeOrders
        .flatMap((po) => {
          const items = parseCartSnapshot(po.cartSnapshot);

          return items.map((item) => ({
            po,
            itemId: item.itemId,
          }));
        })
        .map(async ({ po, itemId }) => {
          const product = storeProducts.find((p) => p.id === itemId);

          if (!product || product.createdByUserId !== userId) return null;

          const items = parseCartSnapshot(po.cartSnapshot);
          const item = items.find((i) => i.itemId === itemId);

          if (!item) return null;

          // 👇 ONLY THIS ITEM's value (NOT full order)
          const itemBase = item.price * (item.quantity ?? 1);

          // if discount exists per item
          const itemDiscount = item.discount ?? 0;

          const netBase = itemBase - itemDiscount;

          // commission only on THIS item
          const commission = (netBase * storeCommission) / 100;

          const finalAmount = netBase - commission;

          return {
            id: `store-${po.id}-${itemId}`,
            createdAt: po.paidAt || po.createdAt,
            jpAmount: finalAmount,
            currency: po.currency,

            breakdown: {
              baseAmount: itemBase,
              commission,
              finalAmount,
              discount: itemDiscount,
            },

            activity: {
              activity: "STORE_EARNING",
              transactionType: "CREDIT",
              displayName: `${po.user?.name ?? "Someone"} bought ${product.name}`,
            },

            activityMeta: {
              productId: product.id,
              productName: product.name,
              buyerId: po.user?.id,
              buyerName: po.user?.name,
            },
          };
        }),
    );
    const formatAmount = (num: number) => Number(num.toFixed(2));

    const affiliateHistory = affiliateEarnings.map((ae) => {
      const userName = ae.referredUser?.name ?? "Someone";

      const order = affiliateOrderMap.get(ae.paymentOrderId);

      const programName = order?.programId
        ? affiliateProgramMap.get(order.programId)
        : null;

      const challengeName = order?.challengeId
        ? affiliateChallengeMap.get(order.challengeId)
        : null;
      let productName: string | null = null;

      if (order?.cartSnapshot && ae.contextId) {
        const items = parseCartSnapshot(order.cartSnapshot);

        const matchedItem = items.find((item) => item.itemId === ae.contextId);

        if (matchedItem) {
          productName =
            affiliateProductMap.get(matchedItem.itemId) ??
            matchedItem.name ??
            null;
        }
      }

      let displayName = `You earned a referral commission`;

      if (ae.contextType === "SUBSCRIPTION") {
        displayName = `${userName} purchased a membership using your referral`;
      }

      if (ae.contextType === "MMP_PROGRAM") {
        displayName = programName
          ? `${userName} joined ${programName} using your referral`
          : `${userName} joined a program using your referral`;
      }

      if (ae.contextType === "CHALLENGE") {
        displayName = challengeName
          ? `${userName} joined ${challengeName} using your referral`
          : `${userName} joined a challenge using your referral`;
      }

      if (ae.contextType === "STORE_PRODUCT") {
        displayName = productName
          ? `${userName} purchased ${productName} using your referral`
          : `${userName} purchased a product using your referral`;
      }

      return {
        id: `affiliate-${ae.id}`,
        createdAt: ae.createdAt,
        jpAmount: formatAmount(ae.earnedAmount),
        currency: ae.currency,

        activity: {
          activity: "AFFILIATE_EARNING",
          transactionType: "CREDIT",
          displayName,
        },

        activityMeta: {
          affiliateId: ae.affiliateId,
          referredUserId: ae.referredUserId,
          referredUserName: userName,

          // ✅ NEW
          programId: order?.programId,
          programName,

          challengeId: order?.challengeId,
          challengeTitle: challengeName,

          productName,

          paymentOrderId: ae.paymentOrderId,
          commissionRate: ae.commissionRate,
          baseAmount: formatAmount(ae.baseAmount),
          discountAmount: formatAmount(ae.discountAmount),
          earnedAmount: formatAmount(ae.earnedAmount),
          commissionType: ae.commissionType,
          contextType: ae.contextType,
        },
      };
    });
    const paymentOrderIds = paymentOrders.map((po) => po.id);

    const invoices = await prisma.invoice.findMany({
      where: {
        paymentOrderId: { in: paymentOrderIds },
        status: "PAID",
      },
      select: {
        paymentOrderId: true,
        pdfUrl: true,
      },
    });

    const invoiceMap = new Map(
      invoices.map((inv) => [inv.paymentOrderId, inv.pdfUrl]),
    );

    // After the main Promise.all, fetch UNFILTERED data for balance cards
    const [allCoachEarnings] = await Promise.all([
      prisma.challengePayment.findMany({
        where: {
          status: PaymentStatus.PAID,
          challenge: { creatorId: userId },
        },
        include: { challenge: true, user: true, paymentOrder: true },
      }),
    ]);

    const programIds = paymentOrders.map((po) => po.programId).filter(Boolean);

    const programs = await prisma.program.findMany({
      where: {
        id: { in: programIds as string[] },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(storeProducts.map((p) => [p.id, p.name]));

    const programMap = new Map(programs.map((p) => [p.id, p.name]));
    const paymentHistory = paymentOrders.map((po) => {
      let displayName = "Payment";

      if (po.contextType === "SUBSCRIPTION") {
        displayName = `Membership: ${po.plan?.name}`;
      }
      if (po.contextType === "CHALLENGE") {
        displayName = po.challenge?.title
          ? `Joined Challenge: ${po.challenge.title}`
          : "Joined Challenge";
      }

      if (po.contextType === "STORE_PRODUCT") {
        const items = parseCartSnapshot(po.cartSnapshot);

        const itemNames = items
          .map((item) => productMap.get(item.itemId))
          .filter((name): name is string => Boolean(name));
        displayName =
          itemNames.length > 0
            ? `Store Purchase: ${itemNames.join(", ")}`
            : "Store Purchase";
      }

      if (po.contextType === "MMP_PROGRAM") {
        const name = po.programId ? programMap.get(po.programId) : null;

        displayName = name ? `MMP Purchase : ${name}` : "Program Purchase";
      }
      if (po.contextType === "CMP") {
        // you MUST have programId or metadata
        const name = po.programId ? programMap.get(po.programId) : null;

        displayName = name ? `Purchase ${name}` : "Complete Makeover Program";
      }

      return {
        id: po.id,
        createdAt: po.paidAt || po.createdAt,
        jpAmount: po.totalAmount,
        currency: po.currency,

        activity: {
          activity: po.contextType,
          transactionType: "DEBIT",
          displayName,
        },

        activityMeta: {
          programId: po.programId,
          storeOrderId: po.storeOrderId,
          invoiceUrl: invoiceMap.get(po.id) ?? null,
        },
      };
    });

    const gpHistory = transactions.map((tx) => {
      let displayName =
        displayMap[tx.activity.activity] || tx.activity.activity;

      const meta = tx.metadata as TransactionMetadata | null;

      // ✅ STORE PURCHASE
      if (tx.activity.activity === "STORE_PURCHASE" && meta?.items?.length) {
        const itemNames = meta.items.map((i) => i.name);
        displayName = `Store Purchase: ${itemNames.join(", ")}`;
      }

      // ✅ STORE SALE
      if (tx.activity.activity === "STORE_SALE" && meta?.items?.length) {
        const itemNames = meta.items.map((i) => i.name);
        displayName = `Product Sold: ${itemNames.join(", ")}`;
      }

      // ✅ Challenge logic (keep this)
      if (meta?.joinerName && meta?.challengeTitle) {
        displayName = `${meta.joinerName} joined ${meta.challengeTitle}`;
      }

      return {
        id: tx.id,
        createdAt: tx.createdAt,
        jpAmount: tx.jpAmount,
        currency: "GP",
        activity: {
          activity: tx.activity.activity,
          transactionType: tx.activity.transactionType,
          displayName,
        },
        activityMeta: meta ?? null,
      };
    });

    const coachEarningsHistory = await Promise.all(
      coachChallengeEarnings.map(async (cp) => {
        const commissionPercent = challengeCommission;

        const baseAmount = cp.paymentOrder?.baseAmount ?? cp.amountPaid;
        const discount = cp.paymentOrder?.discountApplied ?? 0;

        const netBase = baseAmount - discount;

        const commission = (netBase * commissionPercent) / 100;
        const finalAmount = netBase - commission;

        return {
          id: `coach-${cp.id}`,
          createdAt: cp.paidAt || cp.joinedAt,
          jpAmount: finalAmount,
          currency: cp.currency,

          breakdown: {
            baseAmount,
            commission,
            finalAmount,
            discount,
          },

          activity: {
            activity: "CHALLENGE_EARNING",
            transactionType: "CREDIT",
            displayName: `${cp.user.name} joining ${cp.challenge.title}`,
          },

          activityMeta: {
            userId: cp.user.id,
            userName: cp.user.name,
            challengeTitle: cp.challenge.title,
          },
        };
      }),
    );

    let combined = [
      ...gpHistory,
      ...paymentHistory,
      ...coachEarningsHistory,
      ...coachMmpEarnings,
      ...coachStoreEarnings.filter(
        (tx): tx is NonNullable<typeof tx> => tx !== null,
      ),
      ...affiliateHistory,
    ];
    // ✅ Filter by CREDIT / DEBIT
    if (txType !== "ALL") {
      combined = combined.filter(
        (tx) => tx.activity.transactionType === txType,
      );
    }
    // ✅ Apply date range filter
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;

      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      combined = combined.filter((tx) => {
        const txDate = new Date(tx.createdAt);

        if (fromDate && txDate < fromDate) return false;
        if (toDate && txDate > toDate) return false;

        return true;
      });
    }

    if (currency !== "ALL") {
      combined = combined.filter((tx) => tx.currency === currency);
    }

    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalItems = combined.length;
    const totalPages = Math.ceil(totalItems / limit);

    const currentPage = page > totalPages ? totalPages : page;

    // calculate skip AFTER correcting page
    const skipSafe = (currentPage - 1) * limit;

    const paginated = combined.slice(skipSafe, skipSafe + limit);

    const gpBalance = user?.jpBalance ?? 0;
    const commissionPercent = challengeCommission;
    // INR balance (coach challenge earnings after commission)
    const inrCredits = allCoachEarnings
      .filter((cp) => cp.currency === "INR")
      .reduce((sum, cp) => {
        const baseAmount = cp.paymentOrder?.baseAmount ?? cp.amountPaid;
        const discount = cp.paymentOrder?.discountApplied ?? 0;

        const netBase = baseAmount - discount;

        const commission = (netBase * commissionPercent) / 100;
        return sum + (netBase - commission);
      }, 0);

    const inrBalance = inrCredits;

    const usdCredits = allCoachEarnings
      .filter((cp) => cp.currency === "USD")
      .reduce((sum, cp) => {
        const baseAmount = cp.paymentOrder?.baseAmount ?? cp.amountPaid;
        const discount = cp.paymentOrder?.discountApplied ?? 0;

        const netBase = baseAmount - discount;

        const commission = (netBase * commissionPercent) / 100;
        return sum + (netBase - commission);
      }, 0);

    const usdBalance = usdCredits;

    // ------------------------------------
    // TOTAL EARNED / SPENT CALCULATION
    // ------------------------------------
    const totals = {
      earned: { GP: 0, INR: 0, USD: 0 },
      spent: { GP: 0, INR: 0, USD: 0 },
    };

    combined.forEach((tx) => {
      const amount = Number(tx.jpAmount) || 0;
      const cur = tx.currency as "GP" | "INR" | "USD";

      if (!cur) return;

      if (tx.activity.transactionType === "CREDIT") {
        totals.earned[cur] += Number(amount.toFixed(2));
      } else if (tx.activity.transactionType === "DEBIT") {
        totals.spent[cur] += Number(amount.toFixed(2));
      }
    });

    return NextResponse.json({
      transactions: paginated,
      total: totalItems,
      page,
      limit,
      totalPages,
      version: versionFlag ? "v3" : "default",
      currentPage,
      commission: {
        challenges: challengeCommission,
        miniMasteryPrograms: mmpCommission,
      },
      balances: {
        GP: gpBalance,
        INR: inrBalance,
        USD: usdBalance,
      },
      totals,
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
