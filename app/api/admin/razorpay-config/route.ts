import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { isProduction } = await req.json(); // boolean toggle

    const mode = isProduction ? "live" : "test";

    const updated = await prisma.adminRazorpayConfigSettings.upsert({
      where: { id: 1 },
      update: { razorpayMode: mode },
      create: { id: 1, razorpayMode: mode }
    });

    return NextResponse.json({
      success: true,
      razorpayMode: updated.razorpayMode
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update Razorpay mode" },
      { status: 500 }
    );
  }
}