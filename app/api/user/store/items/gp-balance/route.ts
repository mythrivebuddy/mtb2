import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        jpBalance: true,
        jpEarned: true,
        jpSpent: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        balance: user.jpBalance || 0,
        earned: user.jpEarned || 0,
        spent: user.jpSpent || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching GP balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch GP balance" },
      { status: 500 }
    );
  }
}