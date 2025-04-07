import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewAll = searchParams.get("viewAll");
  const session = await checkRole("USER");
  const userId = session.user.id;

  const take = viewAll === "true" ? undefined : 4;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching user history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
