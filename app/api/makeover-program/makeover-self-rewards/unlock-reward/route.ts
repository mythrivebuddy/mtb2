// app/api/self-rewards/unlockable/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    if (!programId) {
        return NextResponse.json({ error: "programId required" }, { status: 400 });
    }

    // 1️⃣ Aggregate GLOBAL points (sum of all areas)
    const points = await prisma.makeoverPointsSummary.aggregate({
        where: {
            userId: session.user.id,
            programId,
        },
        _sum: {
            totalPoints: true,
        },
    });

    const totalPoints = points._sum.totalPoints ?? 0;

    // 2️⃣ Already unlocked checkpoints
    const unlocked = await prisma.userMakeoverSelfReward.findMany({
        where: {
            userId: session.user.id,
            programId,
        },
        select: { checkpointId: true },
    });

    const unlockedCheckpointIds = unlocked.map(u => u.checkpointId);

    // 3️⃣ Eligible checkpoints
    const checkpoints = await prisma.makeoverSelfRewardCheckpoint.findMany({
        where: {
            minPoints: { lte: totalPoints },
            id: { notIn: unlockedCheckpointIds },
        },
        orderBy: { minPoints: "asc" },
    });

    // 4️⃣ Attach rewards per level
    const result = await Promise.all(
        checkpoints.map(async (cp) => {
            const rewards = await prisma.makeoverSelfRewardLibrary.findMany({
                where: {
                    levelId: cp.levelId,
                    isActive: true,
                },
                orderBy: { minPoints: "asc" },
            });

            return {
                checkpointId: cp.id,
                levelId: cp.levelId,
                unlockAtPoints: cp.minPoints,
                rewards,
            };
        })
    );

    return NextResponse.json({
        totalPoints,
        unlockableRewards: result,
    });
}
