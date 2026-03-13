import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── Shared schemas ───────────────────────────────────────────────────────────

const moduleItemSchema = z.object({
  id:           z.number(),
  title:        z.string().min(1),
  type:         z.enum(["video", "text"]),
  videoUrl:     z.string().optional(),
  instructions: z.string().min(1),
  actionTask:   z.string().min(1),
});

const updateProgramBodySchema = z.object({
  name:                z.string().min(3).max(100),
  description:         z.string().min(5).max(300),
  durationDays:        z.number().int().positive(),
  unlockType:          z.enum(["daily", "all"]),
  achievements:        z.array(z.string().min(1)).min(1),
  modules:             z.array(moduleItemSchema).min(1),
  price:               z.number().min(0),
  currency:            z.enum(["INR", "USD"]),
  completionThreshold: z.number().int().min(50).max(100),
  certificateTitle:    z.string().min(1).max(150),
  thumbnailUrl:        z.string().url().optional().or(z.literal("")),
});

// ─── GET /api/mini-mastery-programs/[id] ─────────────────────────────────────
// Fetch a single program owned by the current user — for pre-filling edit form

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const program = await prisma.program.findFirst({
    where: { id: params.id, createdBy: session.user.id },
    select: {
      id:                  true,
      name:                true,
      description:         true,
      durationDays:        true,
      unlockType:          true,
      achievements:        true,
      modules:             true,
      price:               true,
      currency:            true,
      completionThreshold: true,
      certificateTitle:    true,
      thumbnailUrl:        true,
      status:              true,
    },
  });

  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  return NextResponse.json({ program });
}

// ─── PUT /api/mini-mastery-programs/[id] ─────────────────────────────────────
// Update program fields + automatically set status → UNDER_REVIEW
// Only the program owner can edit; PUBLISHED programs are allowed to be re-edited

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse body
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }

  const parsed = updateProgramBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Confirm ownership
  const existing = await prisma.program.findFirst({
    where: { id: params.id, createdBy: userId },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  const data = parsed.data;

  const updated = await prisma.program.update({
    where: { id: params.id },
    data: {
      name:                data.name,
      description:         data.description,
      durationDays:        data.durationDays,
      unlockType:          data.unlockType,
      achievements:        data.achievements as Prisma.InputJsonValue,
      modules:             data.modules     as Prisma.InputJsonValue,
      price:               data.price,
      currency:            data.currency,
      completionThreshold: data.completionThreshold,
      certificateTitle:    data.certificateTitle,
      thumbnailUrl:        data.thumbnailUrl || null,
      // Always send back to review after any edit
      status:              "UNDER_REVIEW",
    },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({
    message: "Program updated and submitted for review.",
    program: updated,
  });
}