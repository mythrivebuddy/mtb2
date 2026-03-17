import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/mini-mastery-programs/preview/[id] ─────────────────────────────
// Returns full program data for preview — no enrollment required.
// Allowed only if: requester is the program creator OR has ADMIN role.

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = params.id;

  if (!programId) {
    return NextResponse.json({ message: "Program ID is required." }, { status: 400 });
  }

  // Fetch program — any status (creator/admin should preview DRAFT too)
  const program = await prisma.program.findFirst({
    where: { id: programId },
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
      status:              true,
      createdBy:           true,
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  // Auth check: only creator or admin
  const isCreator = program.createdBy === userId;
  const isAdmin   = (session.user as { role?: string }).role === "ADMIN";

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ message: "Forbidden. Only the program creator or an admin can preview." }, { status: 403 });
  }

  const totalDays = program.durationDays ?? 0;

  // Return mock progress — all days unlocked, none completed
  console.log(program)
  return NextResponse.json({
    isPreview: true,
    program: {
      id:                  program.id,
      name:                program.name,
      description:         program.description,
      durationDays:        program.durationDays,
      unlockType:          "all",   // unlock all days in preview
      modules:             program.modules,
      completionThreshold: program.completionThreshold,
      certificateTitle:    program.certificateTitle,
      thumbnailUrl:        program.thumbnailUrl,
      status:              program.status,
      creator:             program.creator,
    },
    progress: {
      logs:            [],
      completedCount:  0,
      totalDays,
      progressPct:     0,
      activeDayNumber: 1,
      isFullyCompleted: false,
    },
  });
}