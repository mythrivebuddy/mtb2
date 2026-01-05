import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// to get program details at the home page of the program

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);
        const program = await prisma.program.findFirst({ where: { name: "2026 Complete Makeover Program" } });
        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 });
        }
        const plan = await prisma.subscriptionPlan.findFirst({ where: { programId: program?.id }, select: { id: true } });
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }
        const programSubscription = await prisma.oneTimeProgramPurchase.findFirst({
            where: { userId: session?.user.id },
        });
        if (!programSubscription) {
            return NextResponse.json({ message: "Program not purchased" }, { status: 400 });
        }

        // User has already purchased the program            
        const isProgramOnboardingStarted = program.onboardingStartDate ? new Date() >= program.onboardingStartDate : false;
        const isProgramStarted = program?.startDate ? new Date() >= program.startDate : false;


        return NextResponse.json({ program, plan, isProgramStarted, isProgramOnboardingStarted }, { status: 200 });
    } catch (error) {
        console.error("Error fetching program:", error);
        NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
