import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
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
    const basePrice = parseInt(formData.get("basePrice") as string);
    const monthlyPrice = parseInt(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseInt(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseInt(formData.get("lifetimePrice") as string) || 0;
    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;

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

    // Upload new image if provided
    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleSupabaseImageUpload(imageFile, "store-images", "store-images");
    }

    // Upload new download file if provided
    if (downloadFile && downloadFile.size > 0) {
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

    await prisma.item.delete({
      where: { id },
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
  } finally {
    await prisma.$disconnect();
  }
}






// app/api/admin/store/items/[id]/route.ts



export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }   // ← "id" matches [id] folder
) {
  try {
    const { id } = await context.params;           // ← destructure "id"

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
      imageUrl: product.imageUrl,
      downloadUrl: product.downloadUrl,
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