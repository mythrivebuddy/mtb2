import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    /**
     * ──────────────────────────────────────
     * 🔐 Auth
     * ──────────────────────────────────────
     */
    const session = await checkRole("USER");
    const userId = session.user.id;

    /**
     * ──────────────────────────────────────
     * 📦 Program (stable for prod + testing)
     * ──────────────────────────────────────
     */
    const program = await prisma.program.findFirst({
      where: { slug: "2026-complete-makeover" },
      select: { id: true },
    });

    if (!program?.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const programId = program.id;

    /**
     * ──────────────────────────────────────
     * 🗓️ Calculate CURRENT WEEK (Mon → Today)
     * ──────────────────────────────────────
     */

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // JS: Sun=0, Mon=1, ... Sat=6
    const jsDay = today.getDay();

    // Convert to Monday-based index (Mon=0 … Sun=6)
    const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // Monday of this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - mondayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    /**
     * ──────────────────────────────────────
     * 📊 Count DISTINCT days user showed up
     * ──────────────────────────────────────
     */

    const logs = await prisma.makeoverProgressLog.findMany({
      where: {
        userId,
        programId,
        date: {
          gte: startOfWeek,
          lte: today,
        },
        OR: [
          { identityDone: true },
          { actionDone: true },
          { winLogged: true },
          { weeklyWin: { not: null } },
          { identityShift: { not: null } },
          { nextWeekFocus: { not: null } },
        ],
      },
      select: { date: true },
      distinct: ["date"], // ⭐ counts days, not entries
    });

    /**
     * ──────────────────────────────────────
     * ✅ Response
     * ──────────────────────────────────────
     */

    return NextResponse.json({
      days: logs.length,
      range: {
        start: startOfWeek.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Weekly show-up error:", error);
    return NextResponse.json(
      { error: "Failed to calculate weekly show-up" },
      { status: 500 }
    );
  }
}
