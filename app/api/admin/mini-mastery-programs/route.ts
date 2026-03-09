import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── Auth guard — admin only ──────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  // Adjust role field to match your User model — e.g. session.user.role === "ADMIN"
  if ((session.user as { role?: string }).role !== "ADMIN") return null;
  return session;
}

// ─── GET /api/admin/mini-mastery-programs ─────────────────────────────────────
// Returns ALL programs (all coaches) with filters + pagination
// ?status=DRAFT|UNDER_REVIEW|PUBLISHED  &page=1  &limit=10  &search=foo

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const status   = searchParams.get("status")  ?? undefined;
  const search   = searchParams.get("search")  ?? undefined;
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
  const skip     = (page - 1) * limit;

  const validStatuses = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;
  type ProgramStatus  = (typeof validStatuses)[number];

  const statusFilter: ProgramStatus | undefined =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as ProgramStatus)
      : undefined;

  const where: Prisma.ProgramWhereInput = {
    modules: { not: Prisma.JsonNull },           // only MMP programs
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { name:        { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        status:              true,
        isActive:            true,
        thumbnailUrl:        true,
        createdAt:           true,
        updatedAt:           true,
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
    prisma.program.count({ where }),
  ]);

  return NextResponse.json({
    programs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── PATCH /api/admin/mini-mastery-programs ───────────────────────────────────
// Update status of a program: PUBLISHED | UNDER_REVIEW | DRAFT
// Body: { id: string, status: "PUBLISHED" | "UNDER_REVIEW" | "DRAFT" }

const patchBodySchema = z.object({
  id:     z.string().min(1),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED"]),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { id, status } = parsed.data;

  const program = await prisma.program.findUnique({ where: { id }, select: { id: true } });
  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  const updated = await prisma.program.update({
    where: { id },
    data:  { status },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({ message: "Status updated.", program: updated });
}