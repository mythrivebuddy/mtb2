import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

import { Prisma, InvoiceStatus, PaymentContextType } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    await checkRole("ADMIN");

    // 2. Query params
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");

    const statusParam = searchParams.get("status");
    const contextTypeParam = searchParams.get("contextType");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // 3. Strongly typed where clause
    const where: Prisma.InvoiceWhereInput = {};

    // ✅ Status filter (type-safe enum)
    if (
      statusParam &&
      Object.values(InvoiceStatus).includes(statusParam as InvoiceStatus)
    ) {
      where.status = statusParam as InvoiceStatus;
    }

    // ✅ ContextType filter (type-safe enum)
    if (
      contextTypeParam &&
      Object.values(PaymentContextType).includes(
        contextTypeParam as PaymentContextType
      )
    ) {
      where.contextType = contextTypeParam as PaymentContextType;
    }

    // ✅ Search filter
    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // 4. Fetch data
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          paymentOrder: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // 5. Response
    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("INVOICE_FETCH_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}