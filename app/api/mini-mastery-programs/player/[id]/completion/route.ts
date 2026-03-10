import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── GET /api/mini-mastery-programs/player/[id]/completion ───────────────────
// Returns the MiniMasteryCourseCompletion record for this user+program

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = params.id;

  const record = await prisma.miniMasteryCourseCompletion.findUnique({
    where:  { userId_programId: { userId, programId } },
    select: {
      id:                      true,
      courseCompleted:         true,
      courseCompletedAt:       true,
      certificateDownloaded:   true,
      certificateDownloadedAt: true,
      certificatePath:         true,
      createdAt:               true,
      updatedAt:               true,
    },
  });

  return NextResponse.json({ completion: record ?? null });
}

// ─── POST /api/mini-mastery-programs/player/[id]/completion ──────────────────
// Upserts the completion record.
//
// Body options:
//   { action: "mark_complete" }
//     → sets courseCompleted = true, courseCompletedAt = now (if not already set)
//
//   { action: "mark_certificate_downloaded", certificatePath?: string }
//     → sets certificateDownloaded = true, certificateDownloadedAt = now
//     → optionally saves the certificatePath (Supabase/S3 URL or path)

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark_complete"),
  }),
  z.object({
    action:          z.literal("mark_certificate_downloaded"),
    certificatePath: z.string().optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = params.id;

  // Verify enrollment
  const enrollment = await prisma.userProgramState.findUnique({
    where:  { userId_programId: { userId, programId } },
    select: { id: true },
  });
  if (!enrollment) {
    return NextResponse.json({ message: "Not enrolled in this program." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const now = new Date();

  if (parsed.data.action === "mark_complete") {
    // Only set courseCompletedAt once (don't overwrite)
    const existing = await prisma.miniMasteryCourseCompletion.findUnique({
      where:  { userId_programId: { userId, programId } },
      select: { courseCompletedAt: true },
    });

    const record = await prisma.miniMasteryCourseCompletion.upsert({
      where:  { userId_programId: { userId, programId } },
      create: {
        userId,
        programId,
        courseCompleted:   true,
        courseCompletedAt: now,
      },
      update: {
        courseCompleted:   true,
        // Don't overwrite existing timestamp
        ...(!existing?.courseCompletedAt && { courseCompletedAt: now }),
      },
      select: {
        id:                      true,
        courseCompleted:         true,
        courseCompletedAt:       true,
        certificateDownloaded:   true,
        certificateDownloadedAt: true,
        certificatePath:         true,
      },
    });

    return NextResponse.json({ message: "Course marked as completed.", completion: record });
  }

  if (parsed.data.action === "mark_certificate_downloaded") {
    const record = await prisma.miniMasteryCourseCompletion.upsert({
      where:  { userId_programId: { userId, programId } },
      create: {
        userId,
        programId,
        courseCompleted:         false,
        certificateDownloaded:   true,
        certificateDownloadedAt: now,
        certificatePath:         parsed.data.certificatePath ?? null,
      },
      update: {
        certificateDownloaded:   true,
        certificateDownloadedAt: now,
        // Only update path if a new one is provided
        ...(parsed.data.certificatePath && { certificatePath: parsed.data.certificatePath }),
      },
      select: {
        id:                      true,
        courseCompleted:         true,
        courseCompletedAt:       true,
        certificateDownloaded:   true,
        certificateDownloadedAt: true,
        certificatePath:         true,
      },
    });

    return NextResponse.json({ message: "Certificate download recorded.", completion: record });
  }
}