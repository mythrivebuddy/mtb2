import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── POST /api/mini-mastery-programs/player/[id]/complete ────────────────────
// Mark a specific day as complete (or undo it)
// Body: { dayNumber: number, actionResponse?: string, undo?: boolean }
function toDateString(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const bodySchema = z.object({
  dayNumber: z.number().int().positive(),
  actionResponse: z.string().max(2000).optional(),
  undo: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: programId } = await params;

  // ── Verify enrollment ──────────────────────────────────────────────────────
  const enrolled = await prisma.userProgramState.findUnique({
    where: { userId_programId: { userId, programId } },
    select: {
      id: true,
      user: {
        select: { timezone: true },
      },
      program: {
        select: { unlockType: true }, // ✅ ADD THIS
      },
    },
  });
  if (!enrolled) {
    return NextResponse.json(
      { message: "Not enrolled in this program." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { dayNumber, actionResponse, undo } = parsed.data;

  if (undo) {
    // Un-complete the day
    await prisma.miniMasteryProgressLog.updateMany({
      where: { userId, programId, dayNumber },
      data: { isCompleted: false, completedAt: null },
    });
    return NextResponse.json({ success: true, undone: true, dayNumber });
  }
  const unlockType = enrolled.program?.unlockType;

  // ── 🔒 Unlock validation (CRITICAL) ─────────────────────────────

  if (unlockType !== "all" && dayNumber !== 1) {
    const prevLog = await prisma.miniMasteryProgressLog.findUnique({
      where: {
        userId_programId_dayNumber: {
          userId,
          programId,
          dayNumber: dayNumber - 1,
        },
      },
    });

    if (!prevLog?.isCompleted || !prevLog.completedAt) {
      return NextResponse.json(
        { message: "Previous day not completed." },
        { status: 400 },
      );
    }

    const tz = enrolled.user?.timezone ?? "UTC";

    const completedDateStr = toDateString(new Date(prevLog.completedAt), tz);
    const todayDateStr = toDateString(new Date(), tz);

    // ✅ IMPORTANT: string compare (no Date conversion)
    if (todayDateStr <= completedDateStr) {
      return NextResponse.json(
        { message: "Next day not unlocked yet." },
        { status: 400 },
      );
    }
  }

  // Upsert: create or mark complete
  const log = await prisma.miniMasteryProgressLog.upsert({
    where: { userId_programId_dayNumber: { userId, programId, dayNumber } },
    create: {
      userId,
      programId,
      dayNumber,
      isCompleted: true,
      completedAt: new Date(),
      actionResponse: actionResponse ?? null,
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
      ...(actionResponse !== undefined ? { actionResponse } : {}),
    },
  });

  return NextResponse.json({ success: true, log });
}
