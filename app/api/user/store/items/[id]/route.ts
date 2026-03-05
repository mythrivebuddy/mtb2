import { prisma } from '@/lib/prisma';
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        imageUrl: true,
        downloadUrl: true,
        createdByUserId: true,
        currency: true,
        isApproved: true,
      },
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
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;

    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;

    const rawCurrency = (formData.get("currency") as string) || existingItem.currency || "INR";
    const currency = ["USD", "INR"].includes(rawCurrency) ? rawCurrency : "INR";

    if (!name || !category || isNaN(basePrice)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let imageUrl = existingItem.imageUrl;
    let downloadUrl = existingItem.downloadUrl;
// Replace Image
    if (imageFile && imageFile.size > 0) {
      const oldImagePath = extractStoragePath(existingItem.imageUrl);
      if (oldImagePath) {
        await supabaseAdmin.storage.from("store-images").remove([oldImagePath]);
      }
      imageUrl = await handleSupabaseImageUpload(imageFile, "store-images", "store-images");
    }

    // Replace Download File
    if (downloadFile && downloadFile.size > 0) {
      const oldDownloadPath = extractStoragePath(existingItem.downloadUrl);
      if (oldDownloadPath) {
        await supabaseAdmin.storage.from("store-images").remove([oldDownloadPath]);
      }
      downloadUrl = await handleSupabaseImageUpload(downloadFile, "store-images", "store-images");
    }
    // Update Item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name,
        categoryId: category,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        currency,
        imageUrl,
        downloadUrl,
        // Reset approval if NOT admin
        ...(!isAdmin && {
          isApproved: false,
          approvedAt: null,
          approvedByUserId: null,
        }),
      },
    });

    return NextResponse.json(
      { message: "Item updated successfully", item: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update item", message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        imageUrl: true,
        downloadUrl: true,
        createdByUserId: true,
      },
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

    // Delete storage files using paths extracted from URLs
    const filesToDelete = [
      extractStoragePath(existingItem.imageUrl),
      extractStoragePath(existingItem.downloadUrl),
    ].filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from("store-images")
        .remove(filesToDelete);

      if (error) {
        return NextResponse.json(
          { error: "Failed to delete storage files" },
          { status: 500 }
        );
      }
    }

    // Delete from DB
    await prisma.item.delete({ where: { id: itemId } });

    return NextResponse.json(
      { message: "Item and associated files deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete item", message: errorMessage },
      { status: 500 }
    );
  }
}