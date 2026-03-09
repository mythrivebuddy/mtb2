import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/mini-mastery-programs/player/[id] ───────────────────────────────
// Returns:
//   { enrolled: false }                    → user has no UserProgramState entry
//   { enrolled: true, program, state, progress }  → full player data

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("*********************get api called.**************************")
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = await params.id;

  if (!programId) {
    return NextResponse.json({ message: "Program ID is required." }, { status: 400 });
  }

  // ── 1. Check enrollment (UserProgramState) ──────────────────────────────────
  const state = await prisma.userProgramState.findUnique({
    where:  { userId_programId: { userId, programId } },
    select: {
      id:                        true,
      onboarded:                 true,
      onboardedAt:               true,
      createdAt:                 true,
      lastReminderDate:          true,
      lastGoaMilestoneNotified:  true,
    },
  });

  if (!state) {
    // Not enrolled — front-end should redirect to /programs
    return NextResponse.json({ enrolled: false });
  }

  // ── 2. Fetch program ────────────────────────────────────────────────────────
  const program = await prisma.program.findFirst({
    where:  { id: programId, status: "PUBLISHED", isActive: true },
    select: {
      id:                  true,
      name:                true,
      description:         true,
      durationDays:        true,
      unlockType:          true,
      modules:             true,
      completionThreshold: true,
      certificateTitle:    true,
      thumbnailUrl:        true,
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  // ── 3. Fetch progress logs ──────────────────────────────────────────────────
  const logs = await prisma.miniMasteryProgressLog.findMany({
    where:   { userId, programId },
    select:  {
      id:             true,
      dayNumber:      true,
      isCompleted:    true,
      completedAt:    true,
      actionResponse: true,
    },
    orderBy: { dayNumber: "asc" },
  });

  // ── 4. Compute summary ──────────────────────────────────────────────────────
  const totalDays      = program.durationDays ?? 0;
  const completedCount = logs.filter((l) => l.isCompleted).length;
  const progressPct    = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  // Which is the current active day?
  // = first day that is NOT completed, capped at totalDays
  const completedDays = new Set(logs.filter((l) => l.isCompleted).map((l) => l.dayNumber));
  let activeDayNumber = 1;
  for (let d = 1; d <= totalDays; d++) {
    if (!completedDays.has(d)) { activeDayNumber = d; break; }
    activeDayNumber = totalDays; // all done
  }

  return NextResponse.json({
    enrolled: true,
    program,
    state,
    progress: {
      logs,
      completedCount,
      totalDays,
      progressPct,
      activeDayNumber,
      isFullyCompleted: completedCount >= totalDays,
    },
  });
}