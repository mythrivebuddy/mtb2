// app/api/self-rewards/library/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rewards = await prisma.makeoverSelfRewardLibrary.findMany({
    where: { isActive: true },
    orderBy: [
      { levelId: "asc" },
      { minPoints: "asc" },
    ],
  });

  return NextResponse.json(rewards);
}
