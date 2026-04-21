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
    // const challengePaymentsPromise =
    //   filter === "ALL" || filter === "CHALLENGE"
    //     ? prisma.challengePayment.findMany({
    //         where: { userId },
    //         include: {
    //           challenge: true,
    //           paymentOrder: true,
    //         },
    //       })
    //     : Promise.resolve([]);

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

    const coachMmpEarnings = mmpOrders
      .filter((po) => {
        const program = mmpProgramMap.get(po.programId!);
        return program?.createdBy === userId;
      })
      .map((po) => {
        const program = mmpProgramMap.get(po.programId!);
        const feature = checkFeature({
          feature: "miniMasteryPrograms", // or same "challenges" if shared config
          user: {
            userType: session.user.userType,
            membership: session.user.membership,
          },
        });

        const commissionPercent = feature.allowed
          ? ((feature.config as { commissionPercent?: number })
              .commissionPercent ?? 0)
          : 0;

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
              challenge: true,
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

      paymentOrdersPromise,
      cmpPurchasesPromise,
      coachChallengeEarningsPromise,
    ]);

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
  invoices.map((inv) => [inv.paymentOrderId, inv.pdfUrl])
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
    });

    let combined = [
      ...gpHistory,
      ...paymentHistory,
      ...cmpHistory,
      ...coachEarningsHistory,
      ...coachMmpEarnings,
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
