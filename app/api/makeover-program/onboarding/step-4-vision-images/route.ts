// /api/makeover-program/onboarding/step-4-vision-images/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";



export async function POST(req: Request) {
  try {
    /* ───────── AUTH ───────── */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    /* ───────── BODY (multipart/form-data) ───────── */
    const formData = await req.formData();

    const image = formData.get("image") as File | null;


    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    });
    const programId = subscription?.grantedByPurchaseId;
    if (!programId ) {
      return NextResponse.json(
        { error: "Missing programId" },
        { status: 400 }
      );
    }
    const quarter = "Q1";

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid image type" },
        { status: 400 }
      );
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 400 }
      );
    }

    /* ───────── LOCK CHECK ───────── */
    const locked = await prisma.userVisionImage.findUnique({
      where: {
        userId_programId_quarter: {
          userId,
          programId,
          quarter,
        },
      },
      select: { isLocked: true },
    });

    if (locked?.isLocked) {
      return NextResponse.json(
        { error: "Vision image is locked" },
        { status: 403 }
      );
    }

    /* ───────── UPLOAD TO SUPABASE ───────── */
    const buffer = Buffer.from(await image.arrayBuffer());
    const ext = image.type.split("/")[1];

    // deterministic filename → auto replace on re-upload
    const fileName = `vision-${userId}-${programId}-${quarter}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("makeover-vision-images")
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("makeover-vision-images")
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    /* ───────── UPSERT DB RECORD ───────── */
    await prisma.userVisionImage.upsert({
      where: {
        userId_programId_quarter: {
          userId,
          programId,
          quarter,
        },
      },
      update: {
        imageUrl,
      },
      create: {
        userId,
        programId,
        quarter,
        imageUrl,
        isLocked: false,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error("VISION IMAGE UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
