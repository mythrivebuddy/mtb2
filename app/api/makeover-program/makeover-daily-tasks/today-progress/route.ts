// /api/makeover-program/makeover-daily-tasks/today-progress
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";

export async function GET() {
  const session = await checkRole("USER");
  const user = session.user;
  const today = normalizeDateUTC();

  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true },
  });

  if (!program) {
    return NextResponse.json({ data: [] });
  }

  const logs = await prisma.makeoverProgressLog.findMany({
    where: {
      userId: user.id,
      programId: program.id,
      date: today,
    },
    select: {
      areaId: true,
      identityDone: true,
      actionDone: true,
      winLogged: true,
    },
  });

  return NextResponse.json({ data: logs });
}
