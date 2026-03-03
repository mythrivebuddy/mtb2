import { prisma } from '@/lib/prisma';
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";

import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
    const monthlyPrice =
      parseFloat(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice =
      parseFloat(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice =
      parseFloat(formData.get("lifetimePrice") as string) || 0;

    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;

    const rawCurrency =
      (formData.get("currency") as string) ||
      existingItem.currency ||
      "INR";

    const currency =
      ["USD", "INR"].includes(rawCurrency) ? rawCurrency : "INR";

    if (!name || !category || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl = existingItem.imageUrl;
    let imagePath = existingItem.imagePath;

    let downloadUrl = existingItem.downloadUrl;
    let downloadPath = existingItem.downloadPath;

    // 🔥 Replace Image
    if (imageFile && imageFile.size > 0) {
      if (imagePath) {
        await supabaseAdmin.storage
          .from("store-images")
          .remove([imagePath]);
      }

      const upload = await handleSupabaseImageUpload(
        imageFile,
        "store-images",
        "store-images"
      );

      imageUrl = upload.url;
      imagePath = upload.path;
    }

    // 🔥 Replace Download File
    if (downloadFile && downloadFile.size > 0) {
      if (downloadPath) {
        await supabaseAdmin.storage
          .from("store-images")
          .remove([downloadPath]);
      }

      const upload = await handleSupabaseImageUpload(
        downloadFile,
        "store-images",
        "store-images"
      );

      downloadUrl = upload.url;
      downloadPath = upload.path;
    }

    // ✅ Update Item
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
        imagePath,
        downloadUrl,
        downloadPath,

        // 🔥 Reset approval if NOT admin
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

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

    // 🔥 DELETE STORAGE FILES FIRST
    const filesToDelete = [];

    if (existingItem.imagePath) {
      filesToDelete.push(existingItem.imagePath);
    }

    if (existingItem.downloadPath) {
      filesToDelete.push(existingItem.downloadPath);
    }

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

    // 🔥 THEN DELETE DB
    await prisma.item.delete({
      where: { id: itemId },
    });

    return NextResponse.json(
      { message: "Item and associated files deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete item", message: errorMessage },
      { status: 500 }
    );
  }
}