type GoaProgressInput = {
    totalPoints: number;
    programMaxPoints:number,
    // levelId: number; // 1 → 5
    // earnedBadgesCount: number; // ALL earned badges (for now)
};



// const LEVEL_WEIGHT_MAP: Record<number, number> = {
//     1: 5,
//     2: 20,
//     3: 40,
//     4: 70,
//     5: 100,
// };

export function calculateGoaProgressPercentage({
    totalPoints,
    programMaxPoints,
    // levelId,
    // earnedBadgesCount,
}: GoaProgressInput): number {
    // 1️⃣ Points Progress %
    const pointsProgressPercent = Math.min(
        100,
        (totalPoints / programMaxPoints) * 100
    );
    const goaProgress = Math.floor(pointsProgressPercent)
    return Math.min(100, goaProgress);
}
