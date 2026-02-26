import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";

const prisma = new PrismaClient();

// POST /api/user/store/items/add-items
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const name          = formData.get("name") as string;
    const category      = formData.get("category") as string;
    const basePrice     = parseInt(formData.get("basePrice") as string);
    const monthlyPrice  = parseInt(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice   = parseInt(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseInt(formData.get("lifetimePrice") as string) || 0;
    const imageFile     = formData.get("image") as File;
    const downloadFile  = formData.get("download") as File | null;

    // ✅ Read currency, default to INR, validate
    const rawCurrency = (formData.get("currency") as string) || "INR";
    const currency    = ["USD", "INR"].includes(rawCurrency) ? rawCurrency : "INR";

    if (!name || !category || !imageFile || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const imageUrl = await handleSupabaseImageUpload(
      imageFile,
      "store-images",
      "store-images"
    );

    let downloadUrl: string | undefined;
    if (downloadFile && downloadFile.size > 0) {
      downloadUrl = await handleSupabaseImageUpload(
        downloadFile,
        "store-images",
        "store-images"
      );
    }

    const item = await prisma.item.create({
      data: {
        name,
        categoryId:      category,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        currency,                    // ✅ ADDED
        imageUrl,
        downloadUrl,
        isApproved:      false,
        createdByUserId: session.user.id,
        createdByRole:   "USER",
      },
      select: {
        id:           true,
        name:         true,
        categoryId:   true,
        basePrice:    true,
        monthlyPrice: true,
        yearlyPrice:  true,
        lifetimePrice:true,
        currency:     true,          // ✅ ADDED
        imageUrl:     true,
        downloadUrl:  true,
        isApproved:   true,
        createdAt:    true,
      },
    });

    return NextResponse.json(
      {
        item: {
          ...item,
          category:  item.categoryId,
          createdAt: item.createdAt.toISOString(),
        },
        message: "Item created successfully. Pending admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}