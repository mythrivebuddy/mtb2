import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 🔐 Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    // 🚫 Prevent duplicates (case-insensitive)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          error: "Category already exists",
          category: existingCategory,
        },
        { status: 409 }
      );
    }

    // ✅ Create category
    const category = await prisma.category.create({
      data: {
        name: normalizedName,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
