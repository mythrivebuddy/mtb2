import {prisma} from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    try {
        const program = await prisma.program.findFirst({ where: { name: "2026 Complete Makeover Program" } });
        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 });
        }
        const plan = await prisma.subscriptionPlan.findFirst({ where: { programId: program?.id }, select: { id: true } });
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }
        return NextResponse.json({ program, plan });
    } catch (error) {
        NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
