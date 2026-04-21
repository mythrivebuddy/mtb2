import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { maskEmail } from "@/utils/mask-email";

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

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true, email: true },
    });

    const programUrl = `${process.env.NEXT_URL}/dashboard/mini-mastery-programs/program/${program.id}`;
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN",email:process.env.ADMIN_EMAIL},
      select: { id: true, email: true, name: true },
    });

    //  PUSH (ONLY IF NOT CREATOR)
    if (program.creator?.id && program.creator.id !== currentUserId) {
      void sendPushNotificationToUser(
        program.creator.id,
        "Mini Mastery Program • New Enrollment 🎉",
        `${user?.name} joined your ${program.name}`,
        {
          url: `/dashboard/mini-mastery-programs/program/${program.id}`,
        },
      );
    }

    // ✅ EMAILS (ASYNC NON-BLOCKING)
    void (async () => {
      try {
        // 1️⃣ User email
        if (user?.email) {
          await sendEmailUsingTemplate({
            toEmail: user.email,
            toName: user.name ?? "User",
            templateId: "mmp-free-enrolled-user",
            templateData: {
              username: user.name ?? "User",
              programName: program.name,
              programUrl,
            },
          });
        }

        // 2️⃣ Creator email
        if (program.creator?.email && program.creator.id !== currentUserId) {
          await sendEmailUsingTemplate({
            toEmail: program.creator.email,
            toName: program.creator.name ?? "Creator",
            templateId: "mmp-free-enrolled-creator",
            templateData: {
              creatorName: program.creator.name ?? "Creator",
              username: user?.name,
              programName: program.name,
              programUrl,
            },
          });
        }
        // ⚠️ Admin email Conditions:
        // - admin exists
        // - admin has email
        // - admin is NOT creator (avoid duplicate)
        if (
          admin?.email &&
          admin.id !== program.creator?.id && // avoid duplicate with creator
          admin.id !== currentUserId // avoid self-trigger
        ) {
          await sendEmailUsingTemplate({
            toEmail: admin.email,
            toName: admin.name ?? "Admin",
            templateId: "mmp-free-enrolled-admin",
            templateData: {
              username: user?.name,
              userEmail: maskEmail(user?.email ?? "")?? "N/A",
              programName: program.name,
              creatorName: program.creator?.name ?? "Unknown",
              programUrl,
            },
          });
        }
      } catch (err) {
        console.error("Email error:", err);
      }
    })();

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
