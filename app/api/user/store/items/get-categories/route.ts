import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
        const categories = await prisma.item.findMany({
      select: {
        category: true,
      },
      distinct: ["category"], // Get unique categories
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
