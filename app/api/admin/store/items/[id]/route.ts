import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
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

    // Validate currency
    if (!["USD", "INR"].includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency. Must be USD or INR." },
        { status: 400 }
      );
    }

    if (!name || !categoryId || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Get existing item to preserve image URLs if not updating
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: {
        imageUrl: true,
        downloadUrl: true,
        imagePath: true,
        downloadPath: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    let imageUrl = existingItem.imageUrl;
    let downloadUrl = existingItem.downloadUrl;
    let imagePath = existingItem.imagePath;
    let downloadPath = existingItem.downloadPath;

    // Upload new image if provided
    if (imageFile && imageFile.size > 0) {
      // Delete old image from Supabase storage if it exists
      if (existingItem.imagePath) {
        try {
          await supabaseAdmin.storage
            .from("store-images")
            .remove([existingItem.imagePath]);
          console.log("Old image deleted:", existingItem.imagePath);
        } catch (error) {
          console.error("Error deleting old image:", error);
          // Continue even if deletion fails
        }
      }

      const uploadResult = await handleSupabaseImageUpload(
        imageFile,
        "store-images",
        "store-images"
      );
      imageUrl = uploadResult.url;
      imagePath = uploadResult.path;
    }

    // Upload new download file if provided
    if (downloadFile && downloadFile.size > 0) {
      // Delete old download file from Supabase storage if it exists
      if (existingItem.downloadPath) {
        try {
          await supabaseAdmin.storage
            .from("store-images")
            .remove([existingItem.downloadPath]);
          console.log("Old download file deleted:", existingItem.downloadPath);
        } catch (error) {
          console.error("Error deleting old download file:", error);
          // Continue even if deletion fails
        }
      }

      const uploadResult = await handleSupabaseImageUpload(
        downloadFile,
        "store-images",
        "store-images"
      );
      downloadUrl = uploadResult.url;
      downloadPath = uploadResult.path;
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
        imagePath,
        downloadPath,
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
        imagePath: true,
        downloadPath: true,
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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get item to retrieve file paths before deletion
    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        imagePath: true,
        downloadPath: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Delete files from Supabase storage
    const filesToDelete = [];
    
    if (item.imagePath) {
      filesToDelete.push(item.imagePath);
    }
    
    if (item.downloadPath) {
      filesToDelete.push(item.downloadPath);
    }

    // Delete all files at once if there are any
    if (filesToDelete.length > 0) {
      try {
        await supabaseAdmin.storage
          .from("store-images")
          .remove(filesToDelete);
        console.log("Files deleted from storage:", filesToDelete);
      } catch (error) {
        console.error("Error deleting files from storage:", error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete item from database
    await prisma.item.delete({
      where: { id },
    });

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.item.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
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
      imagePath: product.imagePath,
      downloadPath: product.downloadPath,
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