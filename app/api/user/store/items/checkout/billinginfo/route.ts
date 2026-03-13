// app/api/user/store/checkout/billinginfo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { GST_REGEX } from "@/lib/constant";

// GET - fetch billing info for the current user
export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const billingInfo = await prisma.userBillingInformation.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ billingInfo });
  } catch (error) {
    console.error("GET /checkout/billinginfo error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - upsert billing info for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      gstNumber
    } = body;

    if (!addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const gst = gstNumber?.trim()?.toUpperCase();

    if (country === "IN" && gst && !GST_REGEX.test(gst)) {
      return NextResponse.json(
        { error: "Invalid GST Number format" },
        { status: 400 }
      );
    }
    const billingInfo = await prisma.userBillingInformation.upsert({
      where: { userId: user.id },
      update: {
        phone: phone || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        gstNumber: gst || null,
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        phone: phone || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
         gstNumber: gst || null,
      },
    });

    return NextResponse.json({ billingInfo });
  } catch (error) {
    console.error("POST /checkout/billinginfo error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}