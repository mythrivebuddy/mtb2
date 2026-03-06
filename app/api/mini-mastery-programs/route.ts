// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { z } from "zod";
// import { Prisma } from "@prisma/client";

// // ─── Request body validation schema ──────────────────────────────────────────
// // Mirrors ProgramDBPayload from @/schema/zodSchema — validated again on server
// // so we never trust raw client input directly into Prisma

// const moduleItemSchema = z.object({
//   id: z.number(),
//   title: z.string().min(1),
//   type: z.enum(["video", "text"]),
//   videoUrl: z.string().optional(),
//   instructions: z.string().min(1),
//   actionTask: z.string().min(1),
// });

// const createProgramBodySchema = z.object({
//   name: z.string().min(3).max(100),
//   description: z.string().min(5).max(300),
//   durationDays: z.number().int().positive(),
//   unlockType: z.enum(["daily", "all"]),
//   achievements: z.array(z.string().min(1)).min(1),
//   modules: z.array(moduleItemSchema).min(1),
//   price: z.number().min(0),
//   currency: z.enum(["INR", "USD"]),
//   completionThreshold: z.number().int().min(50).max(100),
//   certificateTitle: z.string().min(1).max(150),
//   status: z.enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED"]).default("UNDER_REVIEW"),
// });

// // ─── Slug builder: name + userId suffix for guaranteed uniqueness ─────────────
// function buildSlug(name: string, userId: string): string {
//   const base = name
//     .toLowerCase()
//     .trim()
//     .replace(/[^\w\s-]/g, "")
//     .replace(/[\s_-]+/g, "-")
//     .replace(/^-+|-+$/g, "");

//   // Take last 8 chars of userId as suffix — short but unique enough
//   const suffix = userId.slice(-8);
//   return `${base}-${suffix}`;
// }

// // ─── POST /api/mini-mastery-programs ─────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   // 1. Auth check
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json(
//       { message: "Unauthorized. Please sign in to create a program." },
//       { status: 401 }
//     );
//   }

//   const userId = session.user.id;

//   // 2. Parse + validate body
//   let body: unknown;
//   try {
//     body = await req.json();
//   } catch {
//     return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
//   }

//   const parsed = createProgramBodySchema.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json(
//       {
//         message: "Validation failed.",
//         errors: parsed.error.flatten().fieldErrors,
//       },
//       { status: 422 }
//     );
//   }

//   const data = parsed.data;
//   const slug = buildSlug(data.name, userId);

//   // 3. Check for duplicate name (unique constraint on Program.name)
//   const existing = await prisma.program.findFirst({
//     where: {
//       OR: [{ name: data.name }, { slug }],
//     },
//     select: { id: true, name: true, slug: true },
//   });

//   if (existing) {
//     const field = existing.name === data.name ? "name" : "slug";
//     return NextResponse.json(
//       { message: `A program with this ${field} already exists. Please choose a different title.` },
//       { status: 409 }
//     );
//   }

//   // 4. Create the Program record
//   // achievements and modules are Json fields — cast explicitly for Prisma
//   const program = await prisma.program.create({
//     data: {
//       name: data.name,
//       slug,
//       description: data.description,
//       durationDays: data.durationDays,
//       unlockType: data.unlockType,
//       achievements: data.achievements as Prisma.InputJsonValue,
//       modules: data.modules as Prisma.InputJsonValue,
//       price: data.price,
//       currency: data.currency,
//       completionThreshold: data.completionThreshold,
//       certificateTitle: data.certificateTitle,
//       status: data.status,
//       createdBy: userId,
//       // Prisma defaults handle: isOneTimeProduct, isActive, createdAt, updatedAt
//     },
//     select: {
//       id: true,
//       name: true,
//       slug: true,
//       status: true,
//       createdAt: true,
//     },
//   });

//   return NextResponse.json(
//     { message: "Program submitted for review successfully.", program },
//     { status: 201 }
//   );
// }

// // ─── GET /api/mini-mastery-programs ──────────────────────────────────────────
// // Returns all MMP programs for the current user session (or public published ones)
// // Supports ?status=PUBLISHED|DRAFT|UNDER_REVIEW and ?page=1&limit=10

// export async function GET(req: NextRequest) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json(
//       { message: "Unauthorized." },
//       { status: 401 }
//     );
//   }
//   const userId = session.user.id;
//   const { searchParams } = new URL(req.url);

//   const status = searchParams.get("status") ?? undefined;
//   const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
//   const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
//   const skip = (page - 1) * limit;

//   // Validate status param if provided
//   const validStatuses = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;
//   type ProgramStatus = (typeof validStatuses)[number];

//   const statusFilter: ProgramStatus | undefined =
//     status && (validStatuses as readonly string[]).includes(status)
//       ? (status as ProgramStatus)
//       : undefined;

//   const where: Prisma.ProgramWhereInput = {
//     // Only return MMP programs — those have modules field set (non-null)
//     modules: { not: Prisma.JsonNull },
//     createdBy: userId,
//     ...(statusFilter ? { status: statusFilter } : {}),
//   };

//   const [programs, total] = await Promise.all([
//     prisma.program.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         slug: true,
//         description: true,
//         durationDays: true,
//         unlockType: true,
//         price: true,
//         currency: true,
//         completionThreshold: true,
//         certificateTitle: true,
//         achievements: true,
//         modules: true,
//         status: true,
//         isActive: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     }),
//     prisma.program.count({ where }),
//   ]);

//   return NextResponse.json({
//     programs,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   });
// }
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── Request body validation schema ──────────────────────────────────────────
// Mirrors ProgramDBPayload from @/schema/zodSchema — validated again on server
// so we never trust raw client input directly into Prisma

const moduleItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  type: z.enum(["video", "text"]),
  videoUrl: z.string().optional(),
  instructions: z.string().min(1),
  actionTask: z.string().min(1),
});

const createProgramBodySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(5).max(300),
  durationDays: z.number().int().positive(),
  unlockType: z.enum(["daily", "all"]),
  achievements: z.array(z.string().min(1)).min(1),
  modules: z.array(moduleItemSchema).min(1),
  price: z.number().min(0),
  currency: z.enum(["INR", "USD"]),
  completionThreshold: z.number().int().min(50).max(100),
  certificateTitle: z.string().min(1).max(150),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED"]).default("UNDER_REVIEW"),
});

// ─── Slug builder: name + userId suffix for guaranteed uniqueness ─────────────
function buildSlug(name: string, userId: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Take last 8 chars of userId as suffix — short but unique enough
  const suffix = userId.slice(-8);
  return `${base}-${suffix}`;
}

// ─── POST /api/mini-mastery-programs ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to create a program." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createProgramBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, userId);

  // 3. Check for duplicate name (unique constraint on Program.name)
  const existing = await prisma.program.findFirst({
    where: {
      OR: [{ name: data.name }, { slug }],
    },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    const field = existing.name === data.name ? "name" : "slug";
    return NextResponse.json(
      { message: `A program with this ${field} already exists. Please choose a different title.` },
      { status: 409 }
    );
  }

  // 4. Create the Program record
  // achievements and modules are Json fields — cast explicitly for Prisma
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
      // Prisma defaults handle: isOneTimeProduct, isActive, createdAt, updatedAt
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
    { status: 201 }
  );
}

// ─── GET /api/mini-mastery-programs ──────────────────────────────────────────
// Returns all MMP programs for the current user session (or public published ones)
// Supports ?status=PUBLISHED|DRAFT|UNDER_REVIEW and ?page=1&limit=10

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }
  const userId = session.user.id;   // ← was missing, caused "createdBy: userId" to use outer scope

  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
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
        thumbnailUrl: true,   // ← added
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.program.count({ where }),
  ]);

  return NextResponse.json({
    programs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}