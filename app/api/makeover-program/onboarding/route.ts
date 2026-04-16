import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CURRENT_MAKEOVER_PROGRAM_QUARTER } from "@/lib/constant";
import { inngest } from "@/lib/inngest";
import { grantProgramAccessToPage } from "@/lib/utils/makeover-program/access/grantProgramAccess";

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
    const { areas, goals, identities, dailyActions, visionStatement } =
      (await req.json()) as OnboardingPayload;

    /* ───────────── VALIDATION ───────────── */
    if (!Array.isArray(areas) || areas.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 areas must be selected" },
        { status: 400 },
      );
    }

    if (!visionStatement || visionStatement.trim().length < 10) {
      return NextResponse.json(
        { error: "Vision statement must be at least 10 characters" },
        { status: 400 },
      );
    }
    const { programId, isPurchased } = await grantProgramAccessToPage();
    if (!programId) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

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
          const goal = goals.find((g) => g.areaId === areaId);
          const identity = identities.find((i) => i.areaId === areaId);
          const action = dailyActions.find((a) => a.areaId === areaId);

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
        data: areas.map((areaId) => ({
          userId,
          programId,
          areaId,
          year,
        })),
      });

      await tx.userMakeoverCommitment.createMany({
        data: areas.map((areaId) => {
          const goal = goals.find((g) => g.areaId === areaId);
          const identity = identities.find((i) => i.areaId === areaId);
          const action = dailyActions.find((a) => a.areaId === areaId);

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
    });

    if (!isEdit) {
      inngest
        .send({
          name: "user.onboarding.completed",
          data: { userId, programId },
        })
        .catch((err) => console.error("Inngest async error:", err));
    }

    const commitments = await prisma.userMakeoverCommitment.findMany({
      where: {
        userId,
        programId,
        quarter,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    const formattedCommitments = commitments.map((c) => ({
      id: c.id,
      goalText: c.goalText,
      identityText: c.identityText,
      visionStatement: c.visionStatement,
      area: c.area
        ? {
            id: c.area.id,
            name: c.area.name,
          }
        : undefined,
    }));
    /* ───────────── RESPONSE ───────────── */
    return NextResponse.json({
      success: true,
      mode: isEdit ? "edited" : "created",
      message: isEdit
        ? "Makeover onboarding updated successfully"
        : "Makeover onboarding completed successfully",
      isPurchased,
      userMakeoverCommitment: formattedCommitments,
    });
  } catch (error) {
    console.error("MAKEOVER ONBOARDING ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
