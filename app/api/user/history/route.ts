import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { activityDisplayMap, activityDisplayMapV3 } from "@/lib/constants/activityNames";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "6");
  const skip = (page - 1) * limit;

  // ✅ Determine version flag
  const versionFlag =
    searchParams.get("version") === "v3" || searchParams.get("v3") === "true";

  // ✅ Pick correct map
  const displayMap = versionFlag ? activityDisplayMapV3 : activityDisplayMap;

  const session = await checkRole("USER");
  const userId = session.user.id;

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { activity: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.transaction.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const currentPage = page > totalPages ? totalPages : page;

    const formattedTransactions = transactions.map((tx) => ({
      ...tx,
      activity: {
        ...tx.activity,
        displayName:
          displayMap[tx.activity.activity] || tx.activity.activity,
      },
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      total,
      page: currentPage,
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
