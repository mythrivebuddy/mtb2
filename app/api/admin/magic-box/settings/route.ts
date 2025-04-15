import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// GET: Get current Magic Box settings
export async function GET() {
  try {
   await checkRole("ADMIN");

    // Get the most recent settings
    const settings = await prisma.magicBoxSettings.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json(
        {
          message: "No settings found, using defaults",
          settings: {
            minJpAmount: 100,
            maxJpAmount: 500,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Magic box settings retrieved successfully",
        settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get magic box settings API Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Update Magic Box settings
export async function POST(request: NextRequest) {
  try {
   await checkRole("ADMIN");
    // const adminId = session.user.id;

    const data = await request.json();
    const { minJpAmount, maxJpAmount } = data;

    // Validate input
    if (minJpAmount === undefined || maxJpAmount === undefined) {
      return NextResponse.json(
        { error: "minJpAmount and maxJpAmount are required" },
        { status: 400 }
      );
    }

    if (minJpAmount < 0 || maxJpAmount < 0) {
      return NextResponse.json(
        { error: "JP amounts must be positive" },
        { status: 400 }
      );
    }

    if (minJpAmount >= maxJpAmount) {
      return NextResponse.json(
        { error: "minJpAmount must be less than maxJpAmount" },
        { status: 400 }
      );
    }

    // Create new settings
    const newSettings = await prisma.magicBoxSettings.create({
      data: {
        minJpAmount,
        maxJpAmount,
      },
    });

    return NextResponse.json(
      {
        message: "Magic box settings updated successfully",
        settings: newSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Update magic box settings API Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
