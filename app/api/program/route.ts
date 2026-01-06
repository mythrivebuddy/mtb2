import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server";

// to get program details at the home page of the program

export const GET = async () => {
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
        console.error("Error fetching program:", error);
        NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}