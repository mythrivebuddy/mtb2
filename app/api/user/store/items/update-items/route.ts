import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";

const prisma = new PrismaClient();

// PUT /api/user/store/items/[id] - Update an item
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
        { error: "You don't have permission to edit this item" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const basePrice = parseInt(formData.get("basePrice") as string);
    const monthlyPrice = parseInt(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseInt(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseInt(formData.get("lifetimePrice") as string) || 0;
    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;

    // Validation
    if (!name || !category || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl = existingItem.imageUrl;
    let downloadUrl = existingItem.downloadUrl;

    // ✅ Upload new image if provided — extract .url from the result
    if (imageFile && imageFile.size > 0) {
      const result = await handleSupabaseImageUpload(
        imageFile,
        "store-images",
        "store-images"
      );
      imageUrl = result.url;
    }

    // ✅ Upload new download file if provided — extract .url from the result
    if (downloadFile && downloadFile.size > 0) {
      const result = await handleSupabaseImageUpload(
        downloadFile,
        "store-images",
        "store-images"
      );
      downloadUrl = result.url;
    }

    // Update item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name,
        categoryId: category,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        imageUrl,
        downloadUrl,
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        basePrice: true,
        monthlyPrice: true,
        yearlyPrice: true,
        lifetimePrice: true,
        imageUrl: true,
        downloadUrl: true,
        isApproved: true,
        createdByRole: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        item: {
          ...updatedItem,
          category: updatedItem.categoryId,
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