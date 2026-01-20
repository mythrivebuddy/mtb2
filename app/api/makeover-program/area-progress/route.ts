// /api/makeover-program/area-progress
import { prisma } from "@/lib/prisma";

import { checkRole } from "@/lib/utils/auth";
import { calculateAreaProgress } from "@/lib/utils/makeover-program/makeover-dashboard/calculateAreaProgress";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await checkRole("USER");

  const progressRows = await prisma.makeoverProgressLog.findMany({
    where: { userId: session.user.id },
    select: {
      areaId: true,
      identityDone: true,
      actionDone: true,
      winLogged: true,
    },
  });

  const areaProgressMap: Record<number, number> = {};

  for (const areaId of new Set(progressRows.map(r => r.areaId))) {
    const rowsForArea = progressRows.filter(r => r.areaId === areaId);

    areaProgressMap[areaId] = calculateAreaProgress(rowsForArea);
  }

  return NextResponse.json({ data: areaProgressMap });
}
