// /api/makeover-program/makeover-dashboard/daily-actions-task-for-quarter/update
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantProgramAccess } from "@/lib/utils/makeover-program/access/grantProgramAccess";
import { CURRENT_MAKEOVER_PROGRAM_QUARTER } from "@/lib/constant";

/* ───────────────── TYPES ───────────────── */

interface DailyActionInput {
    areaId: number;
    actionId?: string;
    customText?: string;
}

interface UpdateDailyActionsPayload {
    dailyActions: DailyActionInput[];
}

/* ───────────────── API ───────────────── */

export async function PATCH(req: Request) {
    try {
        const { userId, programId } = await grantProgramAccess();

        /* ───────── BODY ───────── */
        const { dailyActions } =
            (await req.json()) as UpdateDailyActionsPayload;

        if (!Array.isArray(dailyActions) || dailyActions.length === 0) {
            return NextResponse.json(
                { error: "Invalid payload" },
                { status: 400 }
            );
        }

        /* ───────── TRANSACTION ───────── */
        await prisma.$transaction(async (tx) => {
            for (const action of dailyActions) {
                await tx.userMakeoverCommitment.updateMany({
                    where: {
                        userId,
                        programId,
                        areaId: action.areaId,
                        quarter: CURRENT_MAKEOVER_PROGRAM_QUARTER,
                    },
                    data: {
                        actionId: action.actionId ?? null,
                        actionText: action.customText ?? null,
                    },
                });
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: "Daily actions updated successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("UPDATE DAILY ACTIONS ERROR:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
