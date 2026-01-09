// /api/makeover-program/makeover-daily-tasks/today-lock
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantProgramAccess } from "@/lib/utils/makeover-program/access/grantProgramAccess";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";

export const GET = async () => {
  try {
    const { userId, programId } = await grantProgramAccess();

    const today = normalizeDateUTC();

    /* ----------------------------------
       1️⃣ Fetch user areas
    ---------------------------------- */
    const areas = await prisma.userMakeoverArea.findMany({
      where: {
        userId,
        programId,
      },
      select: {
        areaId: true,
      },
    });

    if (areas.length === 0) {
      return NextResponse.json({
        success: true,
        isDayLocked: false,
      });
    }

    const areaIds = areas.map((a) => a.areaId);

    /* ----------------------------------
       2️⃣ Fetch today's logs
    ---------------------------------- */
    const logs = await prisma.makeoverProgressLog.findMany({
      where: {
        userId,
        programId,
        areaId: { in: areaIds },
        date: today,
      },
      select: {
        identityDone: true,
        actionDone: true,
        winLogged: true,
      },
    });

    /* ----------------------------------
       3️⃣ Compute lock
    ---------------------------------- */
    const isDayLocked =
      logs.length === areaIds.length &&
      logs.every(
        (l) =>
          l.identityDone === true &&
          l.actionDone === true &&
          l.winLogged === true
      );

    if (!isDayLocked) {
      return NextResponse.json({
        success: true,
        isDayLocked: false,
      });
    }

    /* ----------------------------------
       4️⃣ Compute unlock time (next 00:00)
    ---------------------------------- */
    const now = new Date();
    const unlockAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0, 0
    );

    return NextResponse.json({
      success: true,
      isDayLocked: true,
      unlockAt: unlockAt.toISOString(),
    });
  } catch (error) {
    console.error("TODAY LOCK API ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
