// /api/user/financial-details
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { userFinancialSchema } from "@/schema/user-financials-details";
import { checkRole } from "@/lib/utils/auth";

/* ---------------- GET ---------------- */
export async function GET() {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;

    // 1. Fetch Financial Details
    const financialData = await prisma.userFinancialDetails.findUnique({
      where: { userId },
    });

    // 2. Fetch Address: Check BillingInformation FIRST
    let userAddress = await prisma.billingInformation.findUnique({
      where: { userId },
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    // 3. Fetch Address: If not found, check UserBillingInformation SECOND
    if (!userAddress) {
      userAddress = await prisma.userBillingInformation.findUnique({
        where: { userId },
        select: {
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      });
    }

    // Determine if we found a valid address
    const hasAddress = !!userAddress?.addressLine1;

    return NextResponse.json({
      data: financialData,
      address: userAddress,
      hasAddress: hasAddress,
    });
  } catch (error) {
    console.error("GET financial details error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
/* ---------------- POST (CREATE / UPDATE) ---------------- */
export async function POST(req: Request) {
  try {
    const session = await checkRole("USER");

    const body = await req.json();

    /* -------- VALIDATE -------- */
    const parsed = userFinancialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    /* -------- REMOVE CONFIRM FIELD -------- */
    const { confirmAccountNumber, ...cleanData } = data;

    /* -------- UPSERT -------- */
    const result = await prisma.userFinancialDetails.upsert({
      where: {
        userId: session.user.id,
      },
      update: cleanData,
      create: {
        ...cleanData,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Financial details saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("POST financial details error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
