import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if ((session.user as { role?: string }).role !== "ADMIN") return null;
  return session;
}

function buildSlug(name: string, userId: string): string {
  const base = name
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${userId.slice(-8)}`;
}

const moduleItemSchema = z.object({
  id:          z.number(),
  title:       z.string().min(1),
  type:        z.enum(["video", "text"]),
  videoUrl:    z.string().optional(),
  instructions: z.string().min(1),
  actionTask:  z.string().min(1),
});

const createBodySchema = z.object({
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
  // Admin can directly publish or keep under review
  status:              z.enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED"]).default("PUBLISHED"),
});

// ─── POST /api/admin/mini-mastery-programs/create ────────────────────────────

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const userId = session.user.id;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }

  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, userId);

  const existing = await prisma.program.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
    select: { id: true, name: true },
  });
  if (existing) {
    return NextResponse.json(
      { message: "A program with this name already exists." },
      { status: 409 },
    );
  }

  const program = await prisma.program.create({
    data: {
      name:                data.name,
      slug,
      description:         data.description,
      durationDays:        data.durationDays,
      unlockType:          data.unlockType,
      achievements:        data.achievements        as Prisma.InputJsonValue,
      modules:             data.modules             as Prisma.InputJsonValue,
      price:               data.price,
      currency:            data.currency,
      completionThreshold: data.completionThreshold,
      certificateTitle:    data.certificateTitle,
      thumbnailUrl:        data.thumbnailUrl || null,
      status:              data.status,
      createdBy:           userId,
    },
    select: { id: true, name: true, slug: true, status: true, createdAt: true },
  });

  return NextResponse.json(
    { message: "Program created successfully.", program },
    { status: 201 },
  );
}