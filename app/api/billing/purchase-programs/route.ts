// /api/billing/purchase-programs
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PaymentContextType, PaymentStatus } from "@prisma/client";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { calculateDiscount } from "@/lib/payment/payment.utils";

function calculateFinal(
  base: number,
  discount: number,
  isIndia: boolean,
  gstEnabled: boolean,
  gstRate: number,
): number {
  let value = Math.max(0, base - discount);
  if (isIndia && gstEnabled) value += value * gstRate;
  return parseFloat(value.toFixed(2));
}

// ----- MAIN -----
export async function POST(req: Request) {
  try {
    const { planId, couponCode, billingDetails } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { baseUrl, appId, secret, settings, mode } =
      await getCashfreeConfig();

    if (!billingDetails?.country)
      return NextResponse.json(
        { error: "Billing details missing" },
        { status: 400 },
      );

    const isIndia = billingDetails.country === "IN";

    // 1. Fetch the program plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { program: true },
    });

    if (!plan || !plan.programId || !plan.program)
      return NextResponse.json(
        { error: "Invalid Program Plan" },
        { status: 400 },
      );

    if (plan.interval !== "ONE_TIME")
      return NextResponse.json(
        { error: "Plan must be ONE_TIME" },
        { status: 400 },
      );

    const currency = isIndia ? "INR" : "USD";
    const baseAmount = isIndia ? plan.amountINR : plan.amountUSD;
    const gstRate = plan.gstPercentage / 100;

    // 2. Coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { couponCode } });
      if (!coupon)
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }

    const discountValue = calculateDiscount(baseAmount, coupon, currency);

    // 3. Final amount
    const finalAmount = calculateFinal(
      baseAmount,
      discountValue,
      isIndia,
      plan.gstEnabled,
      gstRate,
    );
    const payableAmount = finalAmount <= 0 ? 1 : finalAmount;

    // 4. Create pending purchase
    const purchase = await prisma.oneTimeProgramPurchase.create({
      data: {
        productId: plan.programId,
        planId: plan.id,
        userId,
        status: PaymentStatus.CREATED,
        baseAmount,
        gstAmount:
          isIndia && plan.gstEnabled
            ? parseFloat(((baseAmount - discountValue) * gstRate).toFixed(2))
            : 0,
        discountApplied: discountValue,
        totalAmount: finalAmount,
        currency,
        couponId: coupon?.id || null,
      },
    });
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        contextType: PaymentContextType.CMP,
        orderId: purchase.id,
        razorpayOrderId: purchase.id,
        baseAmount,
        discountApplied: discountValue,
        gstAmount:
          isIndia && plan.gstEnabled
            ? parseFloat(((baseAmount - discountValue) * gstRate).toFixed(2))
            : 0,
        totalAmount: finalAmount,
        currency,
        status: PaymentStatus.CREATED,
        planId: plan.id,
        programId: plan.programId,
        couponId: coupon?.id || null,
      },
    });
    const internalId = purchase.id;
    const orderId = `prog_${internalId}_${Date.now()}`;

    // 5. Save billing details (FIXED!)
    await prisma.billingInformation.upsert({
      where: { userId },
      update: {
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber || null,
      },
      create: {
        userId,
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2 || "",
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber || null,
      },
    });

    // 6. Cashfree Order
    const payload = {
      order_id: orderId,
      order_amount: payableAmount,
      order_currency: currency,
      customer_details: {
        customer_id: userId,
        customer_name: billingDetails.name,
        customer_email: billingDetails.email,
        customer_phone: billingDetails.phone || "9999999999",
      },
      order_meta: {
        // purchase id for the oneTimeProgramPurchase record
        purchase_id: internalId,
        payment_order_id: paymentOrder.id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/program-callback?purchase_id=${internalId}&order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/webhook/cashfree-programs`,
      },
      order_note: `Program Purchase: ${plan.program.name}`,
    };

    const resp = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(payload),
    });

    const cf = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: cf.message || "Cashfree order creation failed" },
        { status: 500 },
      );
    }

    await prisma.oneTimeProgramPurchase.update({
      where: { id: internalId },
      data: {
        orderId,
        cashfreeOrderId: cf.order_id,
        status: PaymentStatus.PENDING,
      },
    });
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        orderId: orderId,
        status: PaymentStatus.PENDING,
        cashfreeOrderId: cf.order_id,
      },
    });

    return NextResponse.json({
      mode,
      paymentSessionId: cf.payment_session_id,
      orderId,
      purchaseId: internalId,
      settings,
    });
  } catch (err) {
    console.error("Program Checkout Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
