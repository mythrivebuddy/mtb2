
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkRole } from "@/lib/utils/auth"

export async function GET() {
    try {
        const session = await checkRole("ADMIN")

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        const challenges = await prisma.challenge.findMany({
            where: {
                challengeJoiningType: "PAID",
                creatorId: userId,
                // status: "ACTIVE",
                endDate: {
                    gte: new Date(),
                },
            },
            select: {
                id: true,
                title: true,
                challengeJoiningFee: true,
                challengeJoiningFeeCurrency: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(challenges)

    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Failed to fetch challenges" },
            { status: 500 }
        )
    }
}