import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// PUT /api/user/store/items/[id] - Update an item

// DELETE /api/user/store/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    // Check if item exists and belongs to user (or user is admin)
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = existingItem.createdByUserId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to delete this item" },
        { status: 403 }
      );
    }

    // Delete the item
    await prisma.item.delete({
      where: { id: itemId },
    });

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting item:", errorMessage);
    return NextResponse.json(
      { error: "Failed to delete item", message: errorMessage },
      { status: 500 }
    );
  }
}