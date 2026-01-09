// /api/makeover-program/makeover-daily-tasks/checkboxes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { normalizeDateUTC } from "@/lib/utils/normalizeDate";

interface RequestBody {
  areaId: number;
  field: "identityDone" | "actionDone" | "winLogged";
  value: boolean;
  date: string;
}

export async function POST(req: Request) {
  /* -------------------------------------------------
     0️⃣ Auth
  ------------------------------------------------- */
  const session = await checkRole("USER");
  const user = session.user;

  const body = (await req.json()) as RequestBody;
  const { areaId, field, value, date } = body;

  console.log("CHECKBOX API:", { areaId, field, value, date });

  if (!areaId || !field || typeof value !== "boolean" || !date) {
    return NextResponse.json(
      { error: "areaId, field, value and date are required" },
      { status: 400 }
    );
  }

  const today = normalizeDateUTC();

  /* -------------------------------------------------
     1️⃣ Resolve Program
  ------------------------------------------------- */
  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true },
  });

  if (!program) {
    return NextResponse.json(
      { error: "Program not found" },
      { status: 404 }
    );
  }

  const programId = program.id;

  /* -------------------------------------------------
     2️⃣ Upsert daily progress row (checkbox only)
  ------------------------------------------------- */
  const log = await prisma.makeoverProgressLog.upsert({
    where: {
      userId_programId_areaId_date: {
        userId: user.id,
        programId,
        areaId,
        date: today,
      },
    },
    update: {
      [field]: value, // ✅ dynamic checkbox update
    },
    create: {
      userId: user.id,
      programId,
      areaId,
      date: today,
      identityDone: field === "identityDone" ? value : false,
      actionDone: field === "actionDone" ? value : false,
      winLogged: field === "winLogged" ? value : false,
      pointsEarned: 0, // ✅ points ONLY via area-complete API
    },
  });

  /* -------------------------------------------------
     3️⃣ Check if area is now complete
  ------------------------------------------------- */
  const isAreaComplete =
    log.identityDone && log.actionDone && log.winLogged;

  return NextResponse.json({
    success: true,
    areaId,
    field,
    value,
    isAreaComplete,
  });
}
