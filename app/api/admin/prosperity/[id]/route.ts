import { checkRole } from "@/lib/utils/auth";
import { ProsperityDropStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define valid status transitions
const VALID_STATUS_TRANSITIONS: Record<
  ProsperityDropStatus,
  ProsperityDropStatus[]
> = {
  APPLIED: ["IN_REVIEW"],
  IN_REVIEW: ["APPROVED", "DISAPPROVED"],
  APPROVED: [], // Terminal state
  DISAPPROVED: [], // Terminal state
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkRole("ADMIN", "You are not authorized for this action");

    const { status: newStatus } = await request.json();
    const { id } = await params;

    // Validate status exists
    if (!Object.values(ProsperityDropStatus).includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid prosperity drop status" },
        { status: 400 }
      );
    }

    const prosperityDrop = await prisma.prosperityDrop.findUnique({
      where: { id },
    });

    if (!prosperityDrop) {
      return NextResponse.json(
        { error: "Prosperity drop application not found" },
        { status: 404 }
      );
    }

    // Check if current status matches requested status
    if (prosperityDrop.status === newStatus) {
      return NextResponse.json(
        {
          error: `Prosperity drop application is already ${newStatus.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[prosperityDrop.status];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${prosperityDrop.status} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update prosperity drop status
    await prisma.prosperityDrop.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json(
      {
        message: `Prosperity drop status changed to ${newStatus} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
