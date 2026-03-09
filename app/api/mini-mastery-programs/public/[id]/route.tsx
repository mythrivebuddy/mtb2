import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/mini-mastery-programs/public/[id] ───────────────────────────────
// Returns a single PUBLISHED program by id — for the detail/info page

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Program ID is required." }, { status: 400 });
  }
  const program = await prisma.program.findFirst({
    where: {
      id,
      status: "PUBLISHED", // only return published programs
      isActive: true,
    },
    select: {
      id:                  true,
      name:                true,
      slug:                true,
      description:         true,
      durationDays:        true,
      unlockType:          true,
      price:               true,
      currency:            true,
      completionThreshold: true,
      certificateTitle:    true,
      achievements:        true,
      modules:             true,
      thumbnailUrl:        true,
      status:              true,
      createdAt:           true,
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  return NextResponse.json({ program });
}