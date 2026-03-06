import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { activityDisplayMap, activityDisplayMapV3 } from "@/lib/constants/activityNames";
import { PaymentStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "6");
  const filter = searchParams.get("filter") || "ALL";
  const skip = (page - 1) * limit;

  // ✅ Determine version flag
  const versionFlag =
    searchParams.get("version") === "v3" || searchParams.get("v3") === "true";

  // ✅ Pick correct map
  const displayMap = versionFlag ? activityDisplayMapV3 : activityDisplayMap;

  const session = await checkRole("USER");
  const userId = session.user.id;

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

    const paymentOrdersPromise =
      filter === "ALL" || filter === "SUBSCRIPTION" || filter === "STORE_ORDER"
        ? prisma.paymentOrder.findMany({
          where: {
            userId,
            status: PaymentStatus.PAID,
            ...(filter === "SUBSCRIPTION"
              ? { contextType: "SUBSCRIPTION" }
              : filter === "STORE_ORDER"
                ? { contextType: "STORE_ORDER" }
                : {}),
          },
          include: {
            plan: true,
          },
        })
        : Promise.resolve([]);

    const cmpPurchasesPromise =
      filter === "ALL" || filter === "CMP"
        ? prisma.oneTimeProgramPurchase.findMany({
          where: { userId,status:PaymentStatus.PAID },
          include: {
            product: true,
          },
        })
        : Promise.resolve([]);

    const [transactions, total, challengePayments, paymentOrders, cmpPurchases] =
      await Promise.all([
        filter === "ALL" || filter === "GP"
          ? prisma.transaction.findMany({
            where: { userId},
            include: { activity: true },
            orderBy: { createdAt: "desc" },
          })
          : Promise.resolve([]),

        prisma.transaction.count({
          where: { userId },
        }),

        challengePaymentsPromise,
        paymentOrdersPromise,
        cmpPurchasesPromise,
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

    const paymentHistory = paymentOrders.map((po) => ({
      id: po.id,
      createdAt: po.paidAt || po.createdAt,
      jpAmount: po.totalAmount,
      currency: po.currency,
      activity: {
        activity: po.contextType,
        transactionType: "DEBIT",
        displayName:
          po.contextType === "SUBSCRIPTION"
            ? `Membership: ${po.plan?.name}`
            : po.contextType === "STORE_ORDER"
              ? `Store Purchase`
              : po.plan?.name || "Payment",
      },
    }));


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
    const gpHistory = transactions.map((tx) => ({
      id: tx.id,
      createdAt: tx.createdAt,
      jpAmount: tx.jpAmount,
      currency: "GP",
      activity: {
        activity: tx.activity.activity,
        transactionType: tx.activity.transactionType,
        displayName:
          displayMap[tx.activity.activity] || tx.activity.activity,
      },
    }));

    const combined = [
      ...gpHistory,
      ...challengeHistory,
      ...paymentHistory,
      ...cmpHistory,
    ];

    combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const totalItems = combined.length;
    const paginated = combined.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page > totalPages ? totalPages : page;

    return NextResponse.json({
      transactions: paginated,
      total: totalItems,
      page,
      limit,
      totalPages,
      version: versionFlag ? "v3" : "default",
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
