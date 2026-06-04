import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
} from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await checkRole("ADMIN");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const statusFilter =
      status && ["DRAFT", "UNDER_REVIEW", "PUBLISHED"].includes(status)
        ? status
        : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...(statusFilter
        ? {
            status: statusFilter,
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { customCategory: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      prisma.hostedEvent.findMany({
        where,
        skip,
        take: limit,
        include: hostedEventInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hostedEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}
