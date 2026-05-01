import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  // count items using this category
  const count = await prisma.item.count({
    where: { categoryId: id },
  });

  if (count === 0) {
    // ✅ HARD DELETE
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      type: "HARD_DELETE",
    });
  }

  // ✅ SOFT DELETE
  await prisma.category.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({
    success: true,
    type: "SOFT_DELETE",
  });
}

// This patch will restore a soft deleted category
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.update({
      where: { id },
      data: {
        isDeleted: false, //  restore
      },
      select: {
        id: true,
        name: true,
        isDeleted: true,
      },
    });

    return NextResponse.json(
      { category },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to restore category", message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}