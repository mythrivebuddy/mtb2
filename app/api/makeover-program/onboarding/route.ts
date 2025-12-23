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

    /* ───────────── PROGRAM OWNERSHIP (CORRECT) ───────────── */
    const purchase = await prisma.oneTimeProgramPurchase.findFirst({
      where: {
        userId,
        status: PaymentStatus.PAID,
      },
      select: {
        productId: true, // Program ID
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "User has not purchased this program" },
        { status: 403 }
      );
    }

    const programId = purchase.productId;
    const quarter = "Q1"; // system controlled
    const year = 2026;

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
          const goal = await tx.makeoverGoalLibrary.create({
            data: {
              areaId: g.areaId,
              title: g.customText,
              isCustom: true,
            },
          });
          goalId = goal.id;
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

      /* 3️⃣ IDENTITIES */
      for (const i of identities) {
        let identityId = i.identityId;

        if (!identityId && i.customText) {
          const identity = await tx.makeoverIdentityLibrary.create({
            data: {
              areaId: i.areaId,
              statement: i.customText,
              isCustom: true,
            },
          });
          identityId = identity.id;
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

      /* 4️⃣ DAILY ACTIONS */
      for (const a of dailyActions) {
        let actionId = a.actionId;

        if (!actionId && a.customText) {
          const action = await tx.makeoverDailyActionLibrary.create({
            data: {
              areaId: a.areaId,
              title: a.customText,
              isCustom: true,
            },
          });
          actionId = action.id;
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

      /* 5️⃣ VISION STATEMENT (CORRECT FIELD) */
      await tx.user.update({
        where: { id: userId },
        data: {
          achievements: visionStatement,
        },
      });

      /* 6️⃣ AUTO ENROLL IN CHALLENGES */
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
