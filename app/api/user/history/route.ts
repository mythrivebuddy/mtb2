import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import {
  activityDisplayMap,
  activityDisplayMapV3,
} from "@/lib/constants/activityNames";
import { PaymentStatus } from "@prisma/client";
import { checkFeature } from "@/lib/access-control/checkFeature";

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
  quantity?: number;
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
  const limit = parseInt(searchParams.get("limit") || "6");
  const filter = searchParams.get("filter") || "ALL";
  const currency = searchParams.get("currency") || "ALL";
  // const skip = (page - 1) * limit;

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
    const challengePaymentsPromise =
      filter === "ALL" || filter === "CHALLENGE"
        ? prisma.challengePayment.findMany({
            where: { userId },
            include: {
              challenge: true,
              paymentOrder: true,
            },
          })
        : Promise.resolve([]);

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
            },
          })
        : Promise.resolve([]);

    const mmpOrders = await prisma.paymentOrder.findMany({
      where: {
        status: PaymentStatus.PAID,
        contextType: "MMP_PROGRAM",
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

    const coachMmpEarnings = mmpOrders
      .filter((po) => {
        const program = mmpProgramMap.get(po.programId!);
        return program?.createdBy === userId;
      })
      .map((po) => {
        const program = mmpProgramMap.get(po.programId!);

        return {
          id: `mmp-${po.id}`,
          createdAt: po.paidAt || po.createdAt,
          jpAmount: po.totalAmount,
          currency: po.currency,

          activity: {
            activity: "MMP_EARNING",
            transactionType: "CREDIT",
            displayName: `MMP Purchase: ${program?.name}`,
          },
        };
      });
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
            },
          })
        : Promise.resolve([]);

    const cmpPurchasesPromise =
      filter === "ALL" || filter === "CMP"
        ? prisma.oneTimeProgramPurchase.findMany({
            where: { userId, status: PaymentStatus.PAID },
            include: {
              product: true,
            },
          })
        : Promise.resolve([]);

    const [
      user,
      transactions,
      challengePayments,
      paymentOrders,
      cmpPurchases,
      coachChallengeEarnings,
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

      challengePaymentsPromise,
      paymentOrdersPromise,
      cmpPurchasesPromise,
      coachChallengeEarningsPromise,
    ]);

    // After the main Promise.all, fetch UNFILTERED data for balance cards
    const [
      allTransactions,
      allPaymentOrders,
      allCmpPurchases,
      allCoachEarnings,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { activity: true },
      }),
      prisma.paymentOrder.findMany({
        where: { userId, status: PaymentStatus.PAID },
        include: { plan: true },
      }),
      prisma.oneTimeProgramPurchase.findMany({
        where: { userId, status: PaymentStatus.PAID },
        include: { product: true },
      }),
      prisma.challengePayment.findMany({
        where: {
          status: PaymentStatus.PAID,
          challenge: { creatorId: userId },
        },
        include: { challenge: true, user: true },
      }),
    ]);

    const challengeHistory = challengePayments.map((cp) => ({
      id: cp.id,
      createdAt: cp.paidAt || cp.joinedAt,
      jpAmount: cp.amountPaid,
      currency: cp.currency,
      activity: {
        activity: "CHALLENGE_JOIN",
        transactionType: "DEBIT",
        displayName: `Joined Challenge: ${cp.challenge.title}`,
      },
    }));

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
    const storeItemIds = paymentOrders
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

    const productMap = new Map(storeProducts.map((p) => [p.id, p.name]));

    const programMap = new Map(programs.map((p) => [p.id, p.name]));
    const paymentHistory = paymentOrders.map((po) => {
      let displayName = "Payment";

      if (po.contextType === "SUBSCRIPTION") {
        displayName = `Membership: ${po.plan?.name}`;
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

        displayName = name ? `Program Purchase : ${name}` : "Program Purchase";
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
        },
      };
    });

    const cmpHistory = cmpPurchases.map((cp) => ({
      id: cp.id,
      createdAt: cp.purchasedAt,
      jpAmount: cp.totalAmount,
      currency: cp.currency,
      activity: {
        activity: "CMP_PURCHASE",
        transactionType: "DEBIT",
        displayName: `${cp.product.name}`,
      },
    }));

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

    const coachEarningsHistory = coachChallengeEarnings.map((cp) => {
      const feature = checkFeature({
        feature: "challenges",
        user: {
          userType: session.user.userType,
          membership: session.user.membership,
        },
      });

      const commissionPercent = feature.allowed
        ? ((feature.config as { commissionPercent?: number })
            .commissionPercent ?? 0)
        : 0;

      const baseAmount = cp.amountPaid;
      const commission = (baseAmount * commissionPercent) / 100;
      const finalAmount = baseAmount - commission;

      return {
        id: `coach-${cp.id}`,
        createdAt: cp.paidAt || cp.joinedAt,
        jpAmount: finalAmount,
        currency: cp.currency,

        breakdown: {
          baseAmount,
          commission,
          finalAmount,
        },

        activity: {
          activity: "CHALLENGE_EARNING",
          transactionType: "CREDIT",
          displayName: `${cp.user.name} joined ${cp.challenge.title}`,
        },

        activityMeta: {
          userId: cp.user.id,
          userName: cp.user.name,
          challengeTitle: cp.challenge.title,
        },
      };
    });

    let combined = [
      ...gpHistory,
      ...challengeHistory,
      ...paymentHistory,
      ...cmpHistory,
      ...coachEarningsHistory,
      ...coachMmpEarnings,
    ];

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
    const feature = checkFeature({
      feature: "challenges",
      user: {
        userType: session.user.userType,
        membership: session.user.membership,
      },
    });

    const commissionPercent = feature.allowed
      ? ((feature.config as { commissionPercent?: number }).commissionPercent ??
        0)
      : 0;
    // INR balance (coach challenge earnings after commission)
    const inrCredits = allCoachEarnings
      .filter((cp) => cp.currency === "INR")
      .reduce((sum, cp) => {
        const commission = (cp.amountPaid * commissionPercent) / 100;
        return sum + (cp.amountPaid - commission);
      }, 0);

    const inrPaymentDebits = paymentOrders
      .filter((po) => po.currency === "INR")
      .reduce((sum, po) => sum + po.totalAmount, 0);

    const inrCmpDebits = cmpPurchases
      .filter((cp) => cp.currency === "INR")
      .reduce((sum, cp) => sum + cp.totalAmount, 0);

   

    const inrBalance = inrCredits;

    const usdCredits = allCoachEarnings
      .filter((cp) => cp.currency === "USD")
      .reduce((sum, cp) => {
        const commission = (cp.amountPaid * commissionPercent) / 100;
        return sum + (cp.amountPaid - commission);
      }, 0);

    const usdBalance = usdCredits;

    // ------------------------------------
    // TOTAL EARNED / SPENT CALCULATION
    // ------------------------------------
    const totals = {
      earned: { GP: 0, INR: 0, USD: 0 },
      spent: { GP: 0, INR: 0, USD: 0 },
    };

    // GP earned/spent from ALL transactions (unfiltered)
    allTransactions.forEach((tx) => {
      const amount = Number(tx.jpAmount) || 0;
      if (tx.activity.transactionType === "CREDIT") totals.earned.GP += amount;
      else if (tx.activity.transactionType === "DEBIT")
        totals.spent.GP += amount;
    });

    // INR/USD spent from ALL payment orders
    allPaymentOrders.forEach((po) => {
      const amount = Number(po.totalAmount) || 0;
      const cur = po.currency as "INR" | "USD";
      if (cur === "INR" || cur === "USD") totals.spent[cur] += amount;
    });

    // INR/USD spent from ALL CMP purchases
    allCmpPurchases.forEach((cp) => {
      const amount = Number(cp.totalAmount) || 0;
      const cur = cp.currency as "INR" | "USD";
      if (cur === "INR" || cur === "USD") totals.spent[cur] += amount;
    });

    // INR/USD earned from ALL coach challenge earnings
    allCoachEarnings.forEach((cp) => {
      const commission = (cp.amountPaid * commissionPercent) / 100;
      const finalAmount = cp.amountPaid - commission;
      const cur = cp.currency as "INR" | "USD";
      if (cur === "INR" || cur === "USD") totals.earned[cur] += finalAmount;
    });

    // INR/USD earned from ALL MMP coach earnings
    mmpOrders
      .filter((po) => mmpProgramMap.get(po.programId!)?.createdBy === userId)
      .forEach((po) => {
        const amount = Number(po.totalAmount) || 0;
        const cur = po.currency as "INR" | "USD";
        if (cur === "INR" || cur === "USD") totals.earned[cur] += amount;
      });

    return NextResponse.json({
      transactions: paginated,
      total: totalItems,
      page,
      limit,
      totalPages,
      version: versionFlag ? "v3" : "default",
      currentPage,
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
