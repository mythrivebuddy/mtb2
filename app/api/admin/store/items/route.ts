import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const prisma = new PrismaClient();

// GET /api/admin/store/items - Fetch all items for admin
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          category: item.category,
          basePrice: item.basePrice,
          monthlyPrice: item.monthlyPrice,
          yearlyPrice: item.yearlyPrice,
          lifetimePrice: item.lifetimePrice,
          currency: item.currency,
          imageUrl: item.imageUrl,
          downloadUrl: item.downloadUrl,
          isApproved: item.isApproved,
          approvedByUserId: item.approvedByUserId,
          approvedAt: item.approvedAt?.toISOString() || null,
          approver: item.approver,
          createdByUserId: item.createdByUserId,
          createdByRole: item.createdByRole,
          creator: item.creator,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// // POST /api/admin/store/items - Create a new item
// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
//     console.log("SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     console.log("USER ROLE:", session.user.role);

//     const isAdmin = session.user.role === "ADMIN";

//     const formData = await request.formData();

//     const name = formData.get("name") as string;
//     const category = formData.get("category") as string;
//     const basePrice = parseFloat(formData.get("basePrice") as string);
//     const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
//     const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
//     const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;
//     const currency = (formData.get("currency") as string) || "USD";
//     const imageFile = formData.get("image") as File;
//     const downloadFile = formData.get("download") as File | null;

//     // Validate currency
//     if (!["USD", "INR"].includes(currency)) {
//       return NextResponse.json(
//         { error: "Invalid currency. Must be USD or INR." },
//         { status: 400 }
//       );
//     }

//     if (!name || !category || !imageFile || isNaN(basePrice)) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const imageUrl = await handleSupabaseImageUpload(
//       imageFile,
//       "store-images",
//       "store-images"
//     );

//     let downloadUrl: string | undefined;

//     if (downloadFile && downloadFile.size > 0) {
//       downloadUrl = await handleSupabaseImageUpload(
//         downloadFile,
//         "store-images",
//         "store-images"
//       );
//     }

//     const item = await prisma.item.create({
//       data: {
//         name,
//         categoryId: category,
//         basePrice,
//         monthlyPrice,
//         yearlyPrice,
//         lifetimePrice,
//         currency,
//         imageUrl,
//         downloadUrl,
//         isApproved: isAdmin,
//         createdByRole: session.user.role,
//         createdByUserId: session.user.id,
//       },
//       include: {
//         category: true,
//       },
//     });

//     return NextResponse.json(
//       {
//         item: {
//           ...item,
//           createdAt: item.createdAt.toISOString(),
//           updatedAt: item.updatedAt.toISOString(),
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error creating item:", error);
//     return NextResponse.json(
//       { error: "Failed to create item" },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // PUT /api/admin/store/items - Update an item
// export async function PUT(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);

//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (session.user.role !== "ADMIN") {
//       return NextResponse.json(
//         { error: "Forbidden - Admin access required" },
//         { status: 403 }
//       );
//     }

//     const url = new URL(request.url);
//     const id = url.pathname.split("/").pop();

//     if (!id) {
//       return NextResponse.json(
//         { error: "Item ID is required" },
//         { status: 400 }
//       );
//     }

//     const existingItem = await prisma.item.findUnique({
//       where: { id },
//       select: {
//         imageUrl: true,
//         downloadUrl: true,
//       },
//     });

//     if (!existingItem) {
//       return NextResponse.json({ error: "Item not found" }, { status: 404 });
//     }

//     const formData = await request.formData();

//     const name = formData.get("name") as string;
//     const category = formData.get("category") as string;
//     const basePrice = parseFloat(formData.get("basePrice") as string);
//     const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
//     const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
//     const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;
//     const currency = (formData.get("currency") as string) || "USD";
//     const imageFile = formData.get("image") as File | null;
//     const downloadFile = formData.get("download") as File | null;

//     // Validate currency
//     if (!["USD", "INR"].includes(currency)) {
//       return NextResponse.json(
//         { error: "Invalid currency. Must be USD or INR." },
//         { status: 400 }
//       );
//     }

//     if (!name || !category || isNaN(basePrice)) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     interface UpdateData {
//       name: string;
//       categoryId: string;
//       basePrice: number;
//       monthlyPrice: number;
//       yearlyPrice: number;
//       lifetimePrice: number;
//       currency: string;
//       imageUrl: string;
//       downloadUrl?: string | null;
//     }

//     const updateData: UpdateData = {
//       name,
//       categoryId: category,
//       basePrice,
//       monthlyPrice,
//       yearlyPrice,
//       lifetimePrice,
//       currency,
//       imageUrl: existingItem.imageUrl,
//       downloadUrl: existingItem.downloadUrl,
//     };

//     if (imageFile && imageFile.size > 0) {
//       updateData.imageUrl = await handleSupabaseImageUpload(
//         imageFile,
//         "store-images",
//         "store-images"
//       );
//     }

//     if (downloadFile && downloadFile.size > 0) {
//       updateData.downloadUrl = await handleSupabaseImageUpload(
//         downloadFile,
//         "store-images",
//         "store-images"
//       );
//     }

//     const item = await prisma.item.update({
//       where: { id },
//       data: updateData,
//       include: {
//         category: true,
//         approver: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(
//       {
//         item: {
//           ...item,
//           createdAt: item.createdAt.toISOString(),
//           updatedAt: item.updatedAt.toISOString(),
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error updating item:", error);
//     return NextResponse.json(
//       { error: "Failed to update item" },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // DELETE /api/admin/store/items - Delete an item
// export async function DELETE(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);

//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (session.user.role !== "ADMIN") {
//       return NextResponse.json(
//         { error: "Forbidden - Admin access required" },
//         { status: 403 }
//       );
//     }

//     const url = new URL(request.url);
//     const id = url.pathname.split("/").pop();

//     if (!id) {
//       return NextResponse.json(
//         { error: "Item ID is required" },
//         { status: 400 }
//       );
//     }

//     await prisma.item.delete({
//       where: { id },
//     });

//     return NextResponse.json(
//       { message: "Item deleted successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting item:", error);
//     return NextResponse.json(
//       { error: "Failed to delete item" },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;
    const currency = (formData.get("currency") as string) || "USD";
    const imageFile = formData.get("image") as File;
    const downloadFile = formData.get("download") as File | null;

    if (!["USD", "INR"].includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency. Must be USD or INR." },
        { status: 400 }
      );
    }

    if (!name || !category || !imageFile || isNaN(basePrice)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const imageUpload = await handleSupabaseImageUpload(
      imageFile,
      "store-images",
      "store-images"
    );

    let downloadUrl: string | undefined;
    let downloadPath: string | undefined;

    if (downloadFile && downloadFile.size > 0) {
      const downloadUpload = await handleSupabaseImageUpload(
        downloadFile,
        "store-images",
        "store-images"
      );

      downloadUrl = downloadUpload.url;
      downloadPath = downloadUpload.path;
    }

    const item = await prisma.item.create({
      data: {
        name,
        categoryId: category,
        basePrice,
        monthlyPrice,
        yearlyPrice,
        lifetimePrice,
        currency,

        imageUrl: imageUpload.url,
        imagePath: imageUpload.path,
        downloadUrl,
        downloadPath,

        isApproved: isAdmin,
        createdByRole: session.user.role,
        createdByUserId: session.user.id,
      },
      include: { category: true },
    });

    return NextResponse.json(
      {
        item: {
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
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



export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string) || 0;
    const yearlyPrice = parseFloat(formData.get("yearlyPrice") as string) || 0;
    const lifetimePrice = parseFloat(formData.get("lifetimePrice") as string) || 0;
    const currency = (formData.get("currency") as string) || "USD";
    const imageFile = formData.get("image") as File | null;
    const downloadFile = formData.get("download") as File | null;

    if (!["USD", "INR"].includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency. Must be USD or INR." },
        { status: 400 }
      );
    }

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

      // delete old image first
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

    const updatedItem = await prisma.item.update({
      where: { id },
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
          ...updatedItem,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: updatedItem.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating item:", error);

    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const filesToDelete = [];

    if (existingItem.imagePath) {
      filesToDelete.push(existingItem.imagePath);
    }

    if (existingItem.downloadPath) {
      filesToDelete.push(existingItem.downloadPath);
    }

    if (filesToDelete.length > 0) {
      await supabaseAdmin.storage
        .from("store-images")
        .remove(filesToDelete);
    }

    await prisma.item.delete({ where: { id } });

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}