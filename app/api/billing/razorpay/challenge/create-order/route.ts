// app/api/billing/razorpay/challenge/create-order/route.ts

import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";


interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string;
}

interface RequestBody {
  challengeId: string;
  billingDetails: BillingDetails;
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

    const body: RequestBody = await req.json();
    const { challengeId, billingDetails } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: "Challenge ID is required" },
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

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || challenge.challengeJoiningType !== "PAID") {
      return NextResponse.json(
        { success: false, error: "Invalid challenge" },
        { status: 400 }
      );
    }

    // Prevent duplicate enrollment
    const existingEnrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: session.user.id,
          challengeId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "Already enrolled in this challenge" },
        { status: 400 }
      );
    }

    const {
      razorpayKeyId,
      razorpayKeySecret,
      mode,
    } = await getRazorpayConfig();

    const baseAmount = challenge.challengeJoiningFee;
    const gstRate = billingDetails.country === "IN" ? 0.18 : 0;
    const gst = baseAmount * gstRate;
    const totalAmount = baseAmount + gst;

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: challenge.challengeJoiningFeeCurrency,
      receipt: crypto.randomBytes(10).toString("hex"),
    });
    console.log("order",order,"total amount: ",totalAmount,"baseAmt : ",baseAmount);
    

    // Upsert Billing Info
    const billing = await prisma.billingInformation.upsert({
      where: { userId: session.user.id },
      update: {
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber ?? null,
      },
      create: {
        userId: session.user.id,
        fullName: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        addressLine1: billingDetails.addressLine1,
        city: billingDetails.city,
        state: billingDetails.state,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        gstNumber: billingDetails.gstNumber ?? null,
      },
    });

    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        challengeId,
        contextType: "CHALLENGE",
        razorpayOrderId: order.id,
        orderId: order.id,
        baseAmount,
        gstAmount: gst,
        totalAmount,
        currency: challenge.challengeJoiningFeeCurrency,
        status: "PENDING",
        billingInfoId: billing.id,
      },
    });

    return NextResponse.json({
      success: true,
      key: razorpayKeyId,
      orderId: order.id,
      mode,
    });

  } catch (error: unknown) {
    console.error("Challenge Order Creation Error:", error);

    let message = "Unable to create payment order";

    if (error instanceof Error) {
      message =
        process.env.NODE_ENV === "development"
          ? error.message
          : message;
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}