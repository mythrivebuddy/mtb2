import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { mtbBusinessProfileSchema } from "@/schema/zodSchema";

export async function GET() {
  try {
    await checkRole("ADMIN");

    const profile = await prisma.mtbBusinessProfile.findFirst();

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await checkRole("ADMIN");

    const formData = await req.formData();
    let invoiceSeries;

    try {
      invoiceSeries = JSON.parse(formData.get("invoiceSeries") as string);
    } catch {
      return NextResponse.json(
        { error: "Invalid invoice series format" },
        { status: 400 },
      );
    }

    const rawData = {
      companyName: formData.get("companyName") as string,
      address: formData.get("address") as string,
      state: formData.get("state") as string,
      country: formData.get("country") as string,
      pincode: formData.get("pincode") as string,
      gstNumber: formData.get("gstNumber") as string,
      lutNumber: formData.get("lutNumber") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string,
      invoiceSeries,
    };

    const parsed = mtbBusinessProfileSchema.safeParse(rawData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const file = formData.get("logo") as File | null;

    let logoUrl: string | undefined;

    if (file && file.size > 0) {
      logoUrl = await handleSupabaseImageUpload(
        file,
        "mtb-logos",
        "business-profile",
      );
    }

    const existing = await prisma.mtbBusinessProfile.findFirst();

    let profile;

    if (existing) {
      profile = await prisma.mtbBusinessProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          logoUrl: logoUrl ?? existing.logoUrl,
        },
      });
    } else {
      profile = await prisma.mtbBusinessProfile.create({
        data: {
          ...data,
          logoUrl,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
