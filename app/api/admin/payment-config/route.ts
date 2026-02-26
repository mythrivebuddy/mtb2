import { NextResponse } from "next/server";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gateway = searchParams.get("gateway");

    if (!gateway) {
      return NextResponse.json(
        { error: "gateway is required" },
        { status: 400 }
      );
    }

    if (gateway === "cashfree") {
      const { baseUrl, mode } = await getCashfreeConfig();

      return NextResponse.json({
        success: true,
        gateway: "cashfree",
        baseUrl,
        mode
      });
    }

    if (gateway === "razorpay") {
      const { mode } = await getRazorpayConfig();

      return NextResponse.json({
        success: true,
        gateway: "razorpay",
        mode
      });
    }

    return NextResponse.json(
      { error: "Invalid gateway" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch payment configuration" },
      { status: 500 }
    );
  }
}