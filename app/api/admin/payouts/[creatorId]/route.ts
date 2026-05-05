// Shows all pending transactions for that creator
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET(
  req: Request,
  { params }: { params: { creatorId: string } }
) {
  await checkRole("ADMIN");

  const { creatorId } = params;

  const earnings = await prisma.creatorEarningLedger.findMany({
    where: {
      creatorId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ earnings });
}   