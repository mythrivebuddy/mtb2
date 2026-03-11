import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

// Helper: extract storage path from Supabase public URL
// e.g. "https://xxx.supabase.co/storage/v1/object/public/store-images/store-images/file.png"
//   → "store-images/file.png"
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const marker = "/object/public/store-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const categoryId = formData.get("category") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;
    const currency = (formData.get("currency") as string) || "USD";
    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;
if (!["USD", "INR", "GP", "JP"].includes(currency)) {
  return NextResponse.json(
    { error: "Invalid currency. Must be USD, INR, GP, or JP." },
    { status: 400 }
  );
}

    if (!name || !categoryId || isNaN(basePrice)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { imageUrl: true, downloadUrl: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let imageUrl = existingItem.imageUrl;
    let downloadUrl = existingItem.downloadUrl;

   // Upload new image if provided
    if (imageFile && imageFile.size > 0) {
      const oldImagePath = extractStoragePath(existingItem.imageUrl);
      if (oldImagePath) {
        try {
          await supabaseAdmin.storage.from("store-images").remove([oldImagePath]);
          console.log("Old image deleted:", oldImagePath);
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }
      imageUrl = await handleSupabaseImageUpload(imageFile, "store-images", "store-images");
    }

    // Upload new download file if provided
    if (downloadFile && downloadFile.size > 0) {
      const oldDownloadPath = extractStoragePath(existingItem.downloadUrl);
      if (oldDownloadPath) {
        try {
          await supabaseAdmin.storage.from("store-images").remove([oldDownloadPath]);
          console.log("Old download file deleted:", oldDownloadPath);
        } catch (error) {
          console.error("Error deleting old download file:", error);
        }
      }
      downloadUrl = await handleSupabaseImageUpload(downloadFile, "store-images", "store-images");
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        categoryId,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        currency,
        imageUrl,
        downloadUrl,
        // imagePath and downloadPath removed
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        basePrice: true,
        monthlyPrice: true,
        yearlyPrice: true,
        lifetimePrice: true,
        currency: true,
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
          ...item,
          category: item.categoryId,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
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
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id },
      select: { imageUrl: true, downloadUrl: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Extract paths from URLs and delete from storage
    const filesToDelete = [
      extractStoragePath(item.imageUrl),
      extractStoragePath(item.downloadUrl),
    ].filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      try {
        await supabaseAdmin.storage.from("store-images").remove(filesToDelete);
        console.log("Files deleted from storage:", filesToDelete);
      } catch (error) {
        console.error("Error deleting files from storage:", error);
      }
    }

    await prisma.item.delete({ where: { id } });

    return NextResponse.json(
      { message: "Item and associated files deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting item:", errorMessage);
    return NextResponse.json(
      { error: "Failed to delete item", message: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await prisma.item.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true, image: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      category: product.category,
      basePrice: product.basePrice,
      monthlyPrice: product.monthlyPrice,
      yearlyPrice: product.yearlyPrice,
      lifetimePrice: product.lifetimePrice,
      currency: product.currency,
      imageUrl: product.imageUrl,
      downloadUrl: product.downloadUrl,
      // imagePath and downloadPath removed — derive on demand via extractStoragePath()
      isApproved: product.isApproved,
      approvedByUserId: product.approvedByUserId,
      approvedAt: product.approvedAt?.toISOString() || null,
      approver: product.approver,
      createdByUserId: product.createdByUserId,
      createdByRole: product.createdByRole,
      creator: product.creator,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json({ product: formattedProduct }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching product:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch product", message: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}