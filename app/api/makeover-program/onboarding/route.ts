import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

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
    } = await req.json();

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
    const exists = await prisma.userMakeoverArea.findFirst({
      where: { userId, programId },
    });
    if (exists) {
      return NextResponse.json(
        { error: "User has already completed this program onboarding" }, { status: 400 });
    }

    /* ───────────── TRANSACTION ───────────── */
    await prisma.$transaction(async (tx) => {
      /* 1️⃣ AREAS */
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

      /* 2️⃣ GOALS */
      for (const g of goals) {
        let goalId = g.goalId;

        if (!goalId && g.customText) {
          const existingGoal = await tx.makeoverGoalLibrary.findFirst({
            where: {
              areaId: g.areaId,
              title: g.customText,
            },
          });

          if (existingGoal) {
            goalId = existingGoal.id;
          } else {
            const goal = await tx.makeoverGoalLibrary.create({
              data: {
                areaId: g.areaId,
                title: g.customText,
                isCustom: true,
              },
            });
            goalId = goal.id;
          }
        }

        await tx.userMakeoverGoal.create({
          data: {
            userId,
            programId,
            areaId: g.areaId,
            goalId,
            quarter,
          },
        });
      }

      /* 3️⃣ IDENTITIES (FIXED) */
      for (const i of identities) {
        let identityId = i.identityId;

        if (!identityId && i.customText) {
          const existingIdentity =
            await tx.makeoverIdentityLibrary.findFirst({
              where: {
                areaId: i.areaId,
                statement: i.customText,
              },
            });

          if (existingIdentity) {
            identityId = existingIdentity.id;
          } else {
            const identity = await tx.makeoverIdentityLibrary.create({
              data: {
                areaId: i.areaId,
                statement: i.customText,
                isCustom: true,
              },
            });
            identityId = identity.id;
          }
        }

        await tx.userMakeoverIdentity.create({
          data: {
            userId,
            programId,
            areaId: i.areaId,
            identityId,
            quarter,
          },
        });
      }

      /* 4️⃣ DAILY ACTIONS (FIXED) */
      for (const a of dailyActions) {
        let actionId = a.actionId;

        if (!actionId && a.customText) {
          const existingAction =
            await tx.makeoverDailyActionLibrary.findFirst({
              where: {
                areaId: a.areaId,
                title: a.customText,
              },
            });

          if (existingAction) {
            actionId = existingAction.id;
          } else {
            const action = await tx.makeoverDailyActionLibrary.create({
              data: {
                areaId: a.areaId,
                title: a.customText,
                isCustom: true,
              },
            });
            actionId = action.id;
          }
        }

        await tx.userMakeoverDailyAction.create({
          data: {
            userId,
            programId,
            areaId: a.areaId,
            actionId,
            quarter,
          },
        });
      }

      /* 5️⃣ VISION STATEMENT */
      await tx.user.update({
        where: { id: userId },
        data: {
          achievements: visionStatement,
        },
      });

      /* 6️⃣ AUTO-ENROLL CHALLENGES */
      const mappings = await tx.makeoverAreaChallengeMap.findMany({
        where: {
          programId,
          areaId: { in: areas },
        },
      });

      for (const map of mappings) {
        await tx.challengeEnrollment.create({
          data: {
            userId,
            challengeId: map.challengeId,
          },
        });
      }
    }); 

    return NextResponse.json({
      success: true,
      message: "Makeover onboarding completed successfully",
    });
  } catch (error: any) {
    console.error("MAKEOVER ONBOARDING ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
