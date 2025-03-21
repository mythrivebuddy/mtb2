import { checkRole } from "@/lib/utils/auth";
import { PrismaClient, SpotlightStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check user role
    await checkRole("ADMIN", "You are not authorized for this action");

    const { status } = await request.json();
    const { id } = await params;

    // Validate status
    if (!Object.values(SpotlightStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid spotlight status" },
        { status: 400 }
      );
    }

    // Fetch spotlight application
    const spotlight = await prisma.spotlight.findUnique({
      where: { id },
    });

    if (!spotlight) {
      return NextResponse.json(
        { error: "Spotlight application not found" },
        { status: 404 }
      );
    }

    // Update spotlight status
    await prisma.spotlight.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(
      { message: "Spotlight status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
