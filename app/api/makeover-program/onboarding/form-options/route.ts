// /api/makeover-program/onboarding/form-options with get req
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const [
        areas,
        goals,
        identities,
        actions,
    ] = await Promise.all([
        prisma.makeoverArea.findMany({ orderBy: { id: 'asc' } }),
        prisma.makeoverGoalLibrary.findMany(),
        prisma.makeoverIdentityLibrary.findMany(),
        prisma.makeoverDailyActionLibrary.findMany(),
    ]);

    return NextResponse.json({
        areas,
        goals,
        identities,
        actions,
    });
}
