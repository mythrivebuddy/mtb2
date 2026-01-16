// /api/makeover-program/makeover-sunday-tasks/today-progress/route.ts
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

  const logs = await prisma.sundayProgressLog.findMany({
    where: {
      userId: user.id,
      programId: program.id,
      date: today,
    },
  });

  const data: { card: 1 | 2 | 3; taskId: string; done: true }[] = [];

  for (const log of logs) {
    if (log.card1WeeklyWin)
      data.push({ card: 1, taskId: "weekly-win", done: true });

    if (log.card1DailyWin)
      data.push({ card: 1, taskId: "daily-win", done: true });

    if (log.card1NextWeekDone)
      data.push({ card: 1, taskId: "next-week", done: true });

    if (log.card2Done)
      data.push({ card: 2, taskId: "identity", done: true });

    if (log.card3Done)
      data.push({ card: 3, taskId: "accountability", done: true });
  }

  return NextResponse.json({ data });
}
