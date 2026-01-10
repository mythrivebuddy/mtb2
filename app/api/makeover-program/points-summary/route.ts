// /api/makeover-program/points-summary
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
    const session = await checkRole("USER");

    const points = await prisma.makeoverPointsSummary.findMany({
        where: {
            userId: session.user.id,
        },
        select: {
            areaId: true,
            totalPoints: true,
        },
    });

    return NextResponse.json({ data: points });
}