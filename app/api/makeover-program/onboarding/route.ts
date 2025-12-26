import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

/* ───────────────── TYPES ───────────────── */

type AreaId = number;

interface GoalInput {
  areaId: AreaId;
  goalId?: string;
  customText?: string;
}

interface IdentityInput {
  areaId: AreaId;
  identityId?: string;
  customText?: string;
}

interface DailyActionInput {
  areaId: AreaId;
  actionId?: string;
  customText?: string;
}

interface OnboardingPayload {
  areas: AreaId[];
  goals: GoalInput[];
  identities: IdentityInput[];
  dailyActions: DailyActionInput[];
  visionStatement: string;
}

/* ───────────────── API ───────────────── */

export async function POST(req: Request) {
  try {
    /* ───────────── AUTH ───────────── */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    /* ───────────── BODY ───────────── */
    const {
      areas,
      goals,
      identities,
      dailyActions,
      visionStatement,
    } = (await req.json()) as OnboardingPayload;

    /* ───────────── VALIDATION ───────────── */
    if (!Array.isArray(areas) || areas.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 areas must be selected" },
        { status: 400 }
      );
    }

    if (!visionStatement || visionStatement.trim().length < 20) {
      return NextResponse.json(
        { error: "Vision statement is required" },
        { status: 400 }
      );
    }

    /* ───────────── PROGRAM OWNERSHIP ───────────── */
    const purchase = await prisma.oneTimeProgramPurchase.findFirst({
      where: {
        userId,
        status: PaymentStatus.PAID,
      },
      select: {
        productId: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "User has not purchased this program" },
        { status: 403 }
      );
    }

    const programId = purchase.productId;
    const quarter = "Q1";
    const year = 2026;

    /* ───────────── DUPLICATE ONBOARDING CHECK ───────────── */
    const exists = await prisma.userMakeoverArea.findFirst({
      where: { userId, programId },
    });

    if (exists) {
      return NextResponse.json(
        { error: "User has already completed onboarding" },
        { status: 400 }
      );
    }

    /* ───────────── TRANSACTION ───────────── */
    await prisma.$transaction(async (tx) => {
      /* 1️⃣ SAVE SELECTED AREAS */
      for (const areaId of areas) {
        await tx.userMakeoverArea.create({
          data: {
            userId,
            programId,
            areaId,
            year,
          },
        });
      }

      /* 2️⃣ CREATE USER COMMITMENTS (CORE TABLE) */
      for (const areaId of areas) {
        const goal = goals.find(
          (g: GoalInput) => g.areaId === areaId
        );
        const identity = identities.find(
          (i: IdentityInput) => i.areaId === areaId
        );
        const action = dailyActions.find(
          (a: DailyActionInput) => a.areaId === areaId
        );

        await tx.userMakeoverCommitment.create({
          data: {
            userId,
            programId,
            areaId,
            quarter,

            goalId: goal?.goalId ?? null,
            goalText: goal?.customText ?? null,

            identityId: identity?.identityId ?? null,
            identityText: identity?.customText ?? null,

            actionId: action?.actionId ?? null,
            actionText: action?.customText ?? null,

            // Same vision statement stored for all 3 areas
            visionStatement,
          },
        });
      }

      /* 3️⃣ AUTO-ENROLL USER INTO AREA CHALLENGES */
      const mappings = await tx.makeoverAreaChallengeMap.findMany({
        where: {
          programId,
          areaId: { in: areas },
        },
      });

      for (const map of mappings) {
        const alreadyEnrolled =
          await tx.userMakeoverChallengeEnrollment.findFirst({
            where: {
              userId,
              programId,
              areaId: map.areaId,
            },
          });

        if (alreadyEnrolled) continue;

        // 1️⃣ Fetch challenge template tasks
        const templateTasks = await tx.challengeTask.findMany({
          where: { challengeId: map.challengeId },
        });

        // 2️⃣ Create enrollment
        const enrollment = await tx.challengeEnrollment.create({
          data: {
            userId,
            challengeId: map.challengeId,
            status: "IN_PROGRESS",
          },
        });

        // 3️⃣ Create user tasks from templates
        if (templateTasks.length > 0) {
          await tx.userChallengeTask.createMany({
            data: templateTasks.map((task) => ({
              description: task.description,
              enrollmentId: enrollment.id,
              templateTaskId: task.id,
            })),
          });
        }
        await tx.userMakeoverChallengeEnrollment.create({
          data: {
            userId,
            programId,
            areaId: map.areaId,
            challengeId: map.challengeId,
            enrollmentId: enrollment.id,
          },
        });
      }



    });

    /* ───────────── RESPONSE ───────────── */
    return NextResponse.json({
      success: true,
      message: "Makeover onboarding completed challenges joined successfully",
    });
  } catch (error) {
    console.error("MAKEOVER ONBOARDING ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
