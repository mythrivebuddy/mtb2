import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // The value from the URL
    const { challengeId } = await params;

    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: session.user.id,
          challengeId: challengeId, // Use the destructured variable
        },
      },
      include: {
        userTasks: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error(`Error fetching enrollment for challenge ${(await params).challengeId}:`, error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}