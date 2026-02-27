import { NextResponse } from "next/server";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function GET() {
  try {
    const [cashfreeConfig, razorpayConfig] = await Promise.all([
      getCashfreeConfig(),
      getRazorpayConfig(),
    ]);
   
    return NextResponse.json({
      success: true,
      cashfree: {
        mode: cashfreeConfig.mode,
        baseUrl: cashfreeConfig.baseUrl,
      },
      razorpay: {
        mode: razorpayConfig.mode,
      },
    });
  } catch (error) {
    console.error("Payment config fetch error:", error);

    return NextResponse.json(
      { error: "Failed to fetch payment configuration" },
      { status: 500 }
    );
  }
}