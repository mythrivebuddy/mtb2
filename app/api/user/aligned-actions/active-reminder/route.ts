import { checkRole } from "@/lib/utils/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/user/aligned-actions/active-reminder
export async function GET() {
    const session = await checkRole("USER");
    const userId = session.user.id;
    const now = new Date();
    const action = await prisma.alignedAction.findFirst({
        where: {
            userId,
            completed: false,
            activeReminder: { not: null },
            popupShown: false,
            timeTo: { gt: now },
        },
        orderBy: { reminderAt: "desc" },
    });

    if (!action) {
        return NextResponse.json({ showPopup: false });
    }

    return NextResponse.json({
        showPopup: true,
        phase: action.activeReminder,
        action,
    });
}
