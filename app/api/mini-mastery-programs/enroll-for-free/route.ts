import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

import { inngest } from "@/lib/inngest";

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole("USER");
    const { programId }: { programId: string } = await req.json();

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          message: "Something went wrong. Please try again.",
        },
        { status: 400 },
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        id: true,
        price: true,
        name: true,
        createdBy: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          message: "This program is no longer available.",
        },
        { status: 404 },
      );
    }

    if ((program.price ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This program requires payment to enroll.",
        },
        { status: 400 },
      );
    }

    const currentUserId = session.user.id;
    const isCreator = program.createdBy === currentUserId;

    // 🔴 CREATOR SELF ENROLL (NO EMAIL / NO PUSH)
    if (isCreator) {
      const existing = await prisma.userProgramState.findUnique({
        where: {
          userId_programId: {
            userId: currentUserId,
            programId,
          },
        },
      });

      if (!existing) {
        await prisma.userProgramState.create({
          data: {
            userId: currentUserId,
            programId,
            onboarded: true,
            onboardedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `You're the creator of "${program.name}" — you already have full access.`,
        alreadyEnrolled: true,
      });
    }

    // ✅ CHECK EXISTING
    const existing = await prisma.userProgramState.findUnique({
      where: {
        userId_programId: {
          userId: currentUserId,
          programId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `You are already enrolled in ${program.name}`,
        alreadyEnrolled: true,
      });
    }

    // ✅ CREATE ENROLLMENT
    await prisma.userProgramState.create({
      data: {
        userId: currentUserId,
        programId,
        onboarded: true,
        onboardedAt: new Date(),
      },
    });

    await inngest.send({
      name: "mmp-challenge-store.notify",
      data: {
        userId: currentUserId,
        entityType: "MMP",
        entityId: program.id,
        isFree: true, //  FREE MMP FLOW
      },
    });

    return NextResponse.json({
      success: true,
      message: `You have successfully enrolled in ${program.name}`,
      alreadyEnrolled: false,
    });
  } catch (error: unknown) {
    console.error("Free enroll error:", error);

    const message =
      error instanceof Error
        ? "Something went wrong. Please try again."
        : "Unexpected error occurred.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
