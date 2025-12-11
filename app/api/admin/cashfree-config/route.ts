// /api/admin/cashfree-config with patch req with isProduction bool in req body
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { isProduction } = await req.json(); // boolean from toggle  

    const mode = isProduction ? "prod" : "sandbox";

    const updated = await prisma.adminCashfreeConfigSettings.upsert({
      where: { id: 1 },
      update: { cashfreeMode: mode },
      create: { id: 1, cashfreeMode: mode }
    });

    return NextResponse.json({
      success: true,
      cashfreeMode: updated.cashfreeMode
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to update Cashfree mode" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const {baseUrl,mode} = await getCashfreeConfig();
    //     "baseUrl": "https://api.cashfree.com/pg",
    // "mode": "prod",

    return NextResponse.json({
      success: true,
      baseUrl,
      mode
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch Cashfree configuration" },
      { status: 500 }
    );
  }
}
