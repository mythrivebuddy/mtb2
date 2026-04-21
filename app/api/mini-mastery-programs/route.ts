import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── Request body validation schema ──────────────────────────────────────────

const createProgramBodySchema = z.object({
  name: z.string().min(1).max(100), // min(3) → min(1)
  description: z.string().min(1).max(300), // min(5) → min(1)
  durationDays: z.number().int().positive(),
  unlockType: z.enum(["daily", "all"]),
  achievements: z.array(z.string()).min(1), // .min(1) on string removed
  modules: z
    .array(
      z.object({
        // moduleItemSchema loose karo
        id: z.number(),
        title: z.string(),
        type: z.enum(["video", "text"]),
        videoUrl: z.string().optional(),
        instructions: z.string(),
        actionTask: z.string(),
      }),
    )
    .min(1),
  price: z.number().min(0),
  currency: z.enum(["INR", "USD"]),
  completionThreshold: z.number().int().min(1).max(100), // min(50) → min(1)
  certificateTitle: z.string().min(0).max(150), // min(1) → min(0)
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  status: z
    .enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED"])
    .default("UNDER_REVIEW"),
});
// ─── Slug builder ─────────────────────────────────────────────────────────────
function buildSlug(name: string, userId: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = userId.slice(-8);
  return `${base}-${suffix}`;
}

// ─── POST /api/mini-mastery-programs ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to create a program." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = createProgramBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, userId);

  const existing = await prisma.program.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    const field = existing.name === data.name ? "name" : "slug";
    return NextResponse.json(
      {
        message: `A program with this ${field} already exists. Please choose a different title.`,
      },
      { status: 409 },
    );
  }

  const program = await prisma.program.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      durationDays: data.durationDays,
      unlockType: data.unlockType,
      achievements: data.achievements as Prisma.InputJsonValue,
      modules: data.modules as Prisma.InputJsonValue,
      price: data.price,
      currency: data.currency,
      completionThreshold: data.completionThreshold,
      certificateTitle: data.certificateTitle,
      thumbnailUrl: data.thumbnailUrl || null,
      status: data.status,
      createdBy: userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { message: "Program submitted for review successfully.", program },
    { status: 201 },
  );
}

// ─── GET /api/mini-mastery-programs ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "10")),
  );
  const skip = (page - 1) * limit;

  const validStatuses = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;
  type ProgramStatus = (typeof validStatuses)[number];

  const statusFilter: ProgramStatus | undefined =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as ProgramStatus)
      : undefined;

  const where: Prisma.ProgramWhereInput = {
    modules: { not: Prisma.JsonNull },
    createdBy: userId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationDays: true,
        unlockType: true,
        price: true,
        currency: true,
        completionThreshold: true,
        certificateTitle: true,
        achievements: true,
        modules: true,
        status: true,
        isActive: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        isComplete: true,
        _count: {
          select: {
            userProgramStates: true,
          },
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

// ─── PATCH /api/mini-mastery-programs  →  Partial update / Submit for Review ─
export async function PATCH(req: NextRequest) {
  console.log("****************************");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const schema = z.object({
    id: z.string().cuid(),
    status: z.enum(["UNDER_REVIEW", "DRAFT"]).optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    durationDays: z.number().int().positive().optional(),
    unlockType: z.enum(["daily", "all"]).optional(),
    achievements: z.array(z.string()).optional(),
    modules: z.array(z.any()).optional(),
    price: z.number().min(0).optional(),
    currency: z.enum(["INR", "USD"]).optional(),
    completionThreshold: z.number().int().min(50).max(100).optional(),
    certificateTitle: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    isComplete: z.boolean().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { id, ...updateFields } = parsed.data;
  console.log("PATCH - id:", id);
  console.log("PATCH - userId:", userId);

  // Confirm program belongs to this user
  const program = await prisma.program.findFirst({
    where: { id, createdBy: userId },
    select: { id: true, status: true },
  });

  if (!program) {
    return NextResponse.json(
      { message: "Program not found." },
      { status: 404 },
    );
  }

  // Published programs ko protect karo
  if (program.status === "PUBLISHED") {
    return NextResponse.json(
      { message: "Published programs cannot be edited." },
      { status: 409 },
    );
  }

  const updated = await prisma.program.update({
    where: { id },
    data: {
      ...updateFields,
      ...(updateFields.achievements
        ? { achievements: updateFields.achievements as Prisma.InputJsonValue }
        : {}),
      ...(updateFields.modules
        ? { modules: updateFields.modules as Prisma.InputJsonValue }
        : {}),
    },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({ message: "Program updated.", program: updated });
}
