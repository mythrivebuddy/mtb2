import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertCurrency } from "@/lib/payment/payment.utils";


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Program ID is required." }, { status: 400 });
  }
  const program = await prisma.program.findFirst({
    where: {
      id,
      status: "PUBLISHED", // only return published programs
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      durationDays: true,
      unlockType: true,
      price: true,
      currency: true,
      completionThreshold: true,
      certificateTitle: true,
      achievements: true,
      modules: true,
      thumbnailUrl: true,
      status: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ message: "Program not found." }, { status: 404 });
  }

  const basePrice = program.price ?? 0;
  const baseCurrency: "INR" | "USD" =
    (program.currency as "INR" | "USD") ?? "INR";

  let priceINR = 0;
  let priceUSD = 0;

  try {
    if (baseCurrency === "INR") {
      priceINR = basePrice;
      priceUSD = await convertCurrency(basePrice, "INR", "USD");
    } else {
      priceUSD = basePrice;
      priceINR = await convertCurrency(basePrice, "USD", "INR");
    }
  } catch (error) {
    console.error("Currency conversion failed", error);
  }

  return NextResponse.json({
    program: {
      ...program,
      priceINR: Number(priceINR.toFixed(2)),
      priceUSD: Number(priceUSD.toFixed(2)),
    },
  });
}