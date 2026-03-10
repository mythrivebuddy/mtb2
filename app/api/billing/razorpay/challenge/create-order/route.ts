import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

import { convertCurrency } from "@/lib/payment/payment.utils";
import { createRazorpayOrder } from "@/lib/payment/createRazorpayOrder";
import { createPaymentOrder } from "@/lib/payment/paymentOrder.service";
import { validateCoupon } from "@/lib/payment/coupons/coupons.service";
import { calculatePayment } from "@/lib/payment/pricingService";
import { upsertBilling } from "@/lib/payment/billingService";

type PurchaseContext = "CHALLENGE" | "MMP_PROGRAM" | "STORE_PRODUCT";

type Currency = "INR" | "USD";

interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  gstNumber?: string;
}

interface CreateOrderRequest {
  context: PurchaseContext;
  entityId: string;
  billingDetails: BillingDetails;
  couponCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateOrderRequest = await req.json();
    const { context, entityId, billingDetails, couponCode } = body;

    if (!context || !entityId) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (
      !billingDetails?.addressLine1 ||
      !billingDetails?.city ||
      !billingDetails?.postalCode
    ) {
      return NextResponse.json(
        { success: false, error: "Incomplete billing details" },
        { status: 400 }
      );
    }

    // --------------------------
    // 1️⃣ FETCH ENTITY
    // --------------------------

    let amount: number;
    let currency: Currency;
    let programId: string | null = null;

    if (context === "CHALLENGE") {
      const challenge = await prisma.challenge.findUnique({
        where: { id: entityId },
      });

      if (!challenge) {
        return NextResponse.json(
          { success: false, error: "Challenge not found" },
          { status: 400 }
        );
      }

      amount = challenge.challengeJoiningFee ?? 0;
      currency = challenge.challengeJoiningFeeCurrency as Currency;
    }

    else if (context === "MMP_PROGRAM") {
      const program = await prisma.program.findUnique({
        where: { id: entityId },
      });

      if (!program) {
        return NextResponse.json(
          { success: false, error: "MMP Program not found" },
          { status: 400 }
        );
      }
      programId = program.id;
      amount = program.price ?? 0;
      currency = program.currency as Currency;
    }

    // else if (context === "STORE_PRODUCT") {
    //   const product = await prisma.storeProduct.findUnique({
    //     where: { id: entityId },
    //   });

    //   if (!product) {
    //     return NextResponse.json(
    //       { success: false, error: "Product not found" },
    //       { status: 400 }
    //     );
    //   }

    //   amount = product.price ?? 0;
    //   currency = product.currency as Currency;
    // }

    else {
      return NextResponse.json(
        { success: false, error: "Invalid purchase context" },
        { status: 400 }
      );
    }

    // --------------------------
    // 2️⃣ CURRENCY CONVERSION
    // --------------------------

    const userCurrency: Currency =
      billingDetails.country === "IN" ? "INR" : "USD";

    if (currency !== userCurrency) {
      amount = await convertCurrency(amount, currency, userCurrency);
      currency = userCurrency;
    }

    // --------------------------
    // 3️⃣ COUPON VALIDATION
    // --------------------------

    const coupon = await validateCoupon({
      couponCode,
      scope: context,
      entityId,
    });

    const isIndia = billingDetails.country === "IN";

    // --------------------------
    // 4️⃣ PRICE CALCULATION
    // --------------------------

    const { discount, totalAmount, gst } = calculatePayment({
      baseAmount: amount,
      coupon,
      currency,
      isIndia,
    });

    // --------------------------
    // 5️⃣ CREATE RAZORPAY ORDER
    // --------------------------

    const { order, key } = await createRazorpayOrder(
      totalAmount,
      currency
    );

    // --------------------------
    // 6️⃣ SAVE BILLING
    // --------------------------

    const billing = await upsertBilling(
      session.user.id,
      billingDetails
    );

    // --------------------------
    // 7️⃣ CREATE PAYMENT ORDER
    // --------------------------

    await createPaymentOrder({
      userId: session.user.id,
      contextType: context,
      entityId,
      razorpayOrderId: order.id,
      baseAmount: amount,
      discount,
      gst,
      totalAmount,
      currency,
      couponId: coupon?.id ?? null,
      billingInfoId: billing.id,
      programId,
    });

    // --------------------------
    // RESPONSE
    // --------------------------
    console.log({
  context,
  entityId,
  amount,
  discount,
  gst,
  totalAmount
});
    return NextResponse.json({
      success: true,
      key,
      orderId: order.id,
    });

  } catch (error) {
    console.error("Payment Order Error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create order" },
      { status: 500 }
    );
  }
}