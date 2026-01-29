import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { CURRENT_MAKEOVER_PROGRAM_QUARTER } from "@/lib/constant";
import { inngest } from "@/lib/inngest";

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

    if (!visionStatement || visionStatement.trim().length < 10) {
      return NextResponse.json(
        { error: "Vision statement must be at least 10 characters" },
        { status: 400 }
      );
    }

    /* ───────────── PROGRAM OWNERSHIP ───────────── */
    const purchase = await prisma.oneTimeProgramPurchase.findFirst({
      where: { userId, status: PaymentStatus.PAID },
      select: { productId: true },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "User has not purchased this program" },
        { status: 403 }
      );
    }

    const programId = purchase.productId;
    const quarter = CURRENT_MAKEOVER_PROGRAM_QUARTER;
    const year = 2026;

    /* ───────────── PROGRAM STATE ───────────── */
    const state = await prisma.userProgramState.upsert({
      where: { userId_programId: { userId, programId } },
      update: {},
      create: { userId, programId },
    });

    const isEdit = state.onboarded === true;

    /* ───────────── PHASE 1: TRANSACTION (FAST) ───────────── */
    await prisma.$transaction(async (tx) => {
      /* ✏️ EDIT MODE → commitments only */
      if (isEdit) {
        for (const areaId of areas) {
          const goal = goals.find(g => g.areaId === areaId);
          const identity = identities.find(i => i.areaId === areaId);
          const action = dailyActions.find(a => a.areaId === areaId);

          await tx.userMakeoverCommitment.update({
            where: {
              userId_programId_areaId_quarter: {
                userId,
                programId,
                areaId,
                quarter,
              },
            },
            data: {
              goalId: goal?.goalId ?? null,
              goalText: goal?.customText ?? null,
              identityId: identity?.identityId ?? null,
              identityText: identity?.customText ?? null,
              actionId: action?.actionId ?? null,
              actionText: action?.customText ?? null,
              visionStatement,
            },
          });
        }

        return;
      }

      /* 🆕 CREATE MODE */

      await tx.userMakeoverArea.createMany({
        data: areas.map(areaId => ({
          userId,
          programId,
          areaId,
          year,
        })),
      });

      await tx.userMakeoverCommitment.createMany({
        data: areas.map(areaId => {
          const goal = goals.find(g => g.areaId === areaId);
          const identity = identities.find(i => i.areaId === areaId);
          const action = dailyActions.find(a => a.areaId === areaId);

          return {
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
            visionStatement,
          };
        }),
      });

      await tx.userProgramState.update({
        where: { userId_programId: { userId, programId } },
        data: { onboarded: true, onboardedAt: new Date() },
      });
      if (!isEdit) {
        await inngest.send({
        name: "user.onboarding.completed",
        data: {
          userId,
          programId,
        },
      });
      }
      
    });

    /* ───────────── PHASE 2: CHALLENGE ENROLLMENT (NO TX) ───────────── */
    // if (!isEdit) {
    //   const mappings = await prisma.makeoverAreaChallengeMap.findMany({
    //     where: { programId, areaId: { in: areas } },
    //   });

    //   for (const map of mappings) {
    //     const enrollment = await prisma.challengeEnrollment.upsert({
    //       where: {
    //         userId_challengeId: {
    //           userId,
    //           challengeId: map.challengeId,
    //         },
    //       },
    //       update: {},
    //       create: {
    //         userId,
    //         challengeId: map.challengeId,
    //         status: "IN_PROGRESS",
    //       },
    //     });

    //     const hasTasks = await prisma.userChallengeTask.findFirst({
    //       where: { enrollmentId: enrollment.id },
    //       select: { id: true },
    //     });

    //     if (!hasTasks) {
    //       const templateTasks = await prisma.challengeTask.findMany({
    //         where: { challengeId: map.challengeId },
    //       });

    //       if (templateTasks.length) {
    //         await prisma.userChallengeTask.createMany({
    //           data: templateTasks.map(task => ({
    //             description: task.description,
    //             enrollmentId: enrollment.id,
    //             templateTaskId: task.id,
    //           })),
    //         });
    //       }
    //     }

    //     await prisma.userMakeoverChallengeEnrollment.upsert({
    //       where: {
    //         userId_programId_areaId: {
    //           userId,
    //           programId,
    //           areaId: map.areaId,
    //         },
    //       },
    //       update: {},
    //       create: {
    //         userId,
    //         programId,
    //         areaId: map.areaId,
    //         challengeId: map.challengeId,
    //         enrollmentId: enrollment.id,
    //       },
    //     });
    //   }
    // }

    /* ───────────── RESPONSE ───────────── */
    return NextResponse.json({
      success: true,
      mode: isEdit ? "edited" : "created",
      message: isEdit
        ? "Makeover onboarding updated successfully"
        : "Makeover onboarding completed successfully",
    });
  } catch (error) {
    console.error("MAKEOVER ONBOARDING ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
