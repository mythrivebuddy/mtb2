import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/mini-mastery-programs/my-status ─────────────────────────────────
// Returns enrollment + completion status for ALL programs for the current user.
// Used by EnrollPage to show correct CTA per program card.
//
// Response:
// {
//   statuses: {
//     [programId]: {
//       enrolled:  boolean,
//       completed: boolean,   // courseCompleted in MiniMasteryCourseCompletion
//     }
//   }
// }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Not signed in — return empty (page will show Enroll for all)
    return NextResponse.json({ statuses: {} });
  }

  const userId = session.user.id;

  // Fetch all UserProgramState rows for this user (enrolled programs)
  const enrollments = await prisma.userProgramState.findMany({
    where:  { userId },
    select: { programId: true },
  });

  // Fetch all MiniMasteryCourseCompletion rows for this user
  const completions = await prisma.miniMasteryCourseCompletion.findMany({
    where:  { userId, courseCompleted: true },
    select: { programId: true },
  });

  const enrolledSet  = new Set(enrollments.map((e) => e.programId));
  const completedSet = new Set(completions.map((c) => c.programId));

  // Build map: programId → { enrolled, completed }
  const statuses: Record<string, { enrolled: boolean; completed: boolean }> = {};

  for (const programId of enrolledSet) {
    statuses[programId] = {
      enrolled:  true,
      completed: completedSet.has(programId),
    };
  }

  return NextResponse.json({ statuses });
}