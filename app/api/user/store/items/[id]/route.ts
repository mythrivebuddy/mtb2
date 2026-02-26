import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";

const prisma = new PrismaClient();

// PUT /api/user/store/items/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

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
        { error: "You don't have permission to edit this item" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const name          = formData.get("name") as string;
    const category      = formData.get("category") as string;
    const basePrice     = parseInt(formData.get("basePrice") as string);
    const monthlyPrice  = parseInt(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice   = parseInt(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseInt(formData.get("lifetimePrice") as string) || 0;
    const imageFile     = formData.get("image") as File | null;
    const downloadFile  = formData.get("download") as File | null;

    // ✅ Read currency, fallback to existing item's currency, then INR
    const rawCurrency = (formData.get("currency") as string) || existingItem.currency || "INR";
    const currency    = ["USD", "INR"].includes(rawCurrency) ? rawCurrency : "INR";

    if (!name || !category || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl    = existingItem.imageUrl;
    let downloadUrl = existingItem.downloadUrl;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleSupabaseImageUpload(imageFile, "store-images", "store-images");
    }

    if (downloadFile && downloadFile.size > 0) {
      downloadUrl = await handleSupabaseImageUpload(downloadFile, "store-images", "store-images");
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name,
        categoryId: category,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        currency,                  // ✅ ADDED
        imageUrl,
        downloadUrl,
      },
      select: {
        id:             true,
        name:           true,
        categoryId:     true,
        basePrice:      true,
        monthlyPrice:   true,
        yearlyPrice:    true,
        lifetimePrice:  true,
        currency:       true,      // ✅ ADDED
        imageUrl:       true,
        downloadUrl:    true,
        isApproved:     true,
        createdByRole:  true,
        createdByUserId:true,
        createdAt:      true,
        updatedAt:      true,
      },
    });

    return NextResponse.json(
      {
        item: {
          ...updatedItem,
          category:  updatedItem.categoryId,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: updatedItem.updatedAt.toISOString(),
        },
        message: "Item updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating item:", errorMessage);
    return NextResponse.json(
      { error: "Failed to update item", message: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/user/store/items/[id] - unchanged
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

    await prisma.item.delete({ where: { id: itemId } });

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