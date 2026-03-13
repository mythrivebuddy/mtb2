import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─── GET /api/mini-mastery-programs/public ────────────────────────────────────
// Returns PUBLISHED programs only — for the enroll/discovery page
// Supports:
//   ?page=1&limit=9
//   ?pricing=free|paid          (filter)
//   ?duration=7|14|21|30        (filter — exact durationDays)
//   ?sort=popular|newest|price_asc|price_desc

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "9")));
  const skip  = (page - 1) * limit;

  // ── Filters ─────────────────────────────────────────────────────────────────
  const pricing  = searchParams.get("pricing");   // "free" | "paid"
  const duration = searchParams.get("duration");  // "7" | "14" | "21" | "30"

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sort = searchParams.get("sort") ?? "newest";

  const orderBy: Prisma.ProgramOrderByWithRelationInput = (() => {
    switch (sort) {
      case "price_asc":  return { price: "asc"  };
      case "price_desc": return { price: "desc" };
      case "newest":
      default:           return { createdAt: "desc" };
    }
  })();

  // ── Where clause ────────────────────────────────────────────────────────────
  const where: Prisma.ProgramWhereInput = {
    // status:  "UNDER_REVIEW",
    status:  "PUBLISHED",
    isActive: true,
    modules: { not: Prisma.JsonNull }, // only MMP programs
    ...(duration ? { durationDays: parseInt(duration) } : {}),
    ...(pricing === "free" ? { price: 0 } : {}),
    ...(pricing === "paid"
      ? { price: { gt: 0 } }
      : {}),
  };

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
        createdAt:           true,
        thumbnailUrl:       true,
        // Include creator name for "Coach" display
        creator: {
          select: { id: true, name: true, image: true },
        },
        createdBy: true,
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