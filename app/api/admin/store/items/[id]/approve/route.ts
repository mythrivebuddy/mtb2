import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH /api/admin/store/items/[id]/approve - Approve or disapprove an item
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id: itemId } = await context.params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== "boolean") {
      return NextResponse.json(
        { error: "isApproved must be a boolean value" },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update the approval status with tracking
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        isApproved,
        approvedByUserId: isApproved ? session.user.id : null,
        approvedAt: isApproved ? new Date() : null,
      },
      include: {
        category: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        item: updatedItem,
        message: isApproved
          ? "Item approved successfully"
          : "Item disapproved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating item approval status:", errorMessage);
    return NextResponse.json(
      { error: "Failed to update item approval status", message: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}