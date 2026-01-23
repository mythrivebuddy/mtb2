type GoaProgressInput = {
    totalPoints: number;
    // levelId: number; // 1 → 5
    // earnedBadgesCount: number; // ALL earned badges (for now)
};

const GOA_MAX_POINTS = 172_800;

// const LEVEL_WEIGHT_MAP: Record<number, number> = {
//     1: 5,
//     2: 20,
//     3: 40,
//     4: 70,
//     5: 100,
// };

/**
 * Calculates Goa Journey Progress Percentage
 * Based strictly on Goa Eligibility Doc
 */
export function calculateGoaProgressPercentage({
    totalPoints,
    // levelId,
    // earnedBadgesCount,
}: GoaProgressInput): number {
    // 1️⃣ Points Progress %
    const pointsProgressPercent = Math.min(
        100,
        (totalPoints / GOA_MAX_POINTS) * 100
    );

    // 2️⃣ Level Weight %
    // const levelWeightPercent = LEVEL_WEIGHT_MAP[levelId] ?? 0;

    // // 3️⃣ Badge Weight %
    // // For now: every badge counts as a Major badge
    // const badgeWeightPercent = Math.min(100, earnedBadgesCount * 10);

    // // 4️⃣ Final Goa Progress %
    // const goaProgress = Math.floor(
    //     pointsProgressPercent * 0.7 +
    //     levelWeightPercent * 0.2 +
    //     badgeWeightPercent * 0.1
    // );
    const goaProgress = Math.floor(pointsProgressPercent)

    return Math.min(100, goaProgress);
}
