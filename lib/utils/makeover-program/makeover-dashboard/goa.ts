type GoaProgressInput = {
    totalPoints: number;
    programMaxPoints: number,
    lastGoaMileStoneNotified?: number,

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
const GOA_MILESTONES = [25, 50, 75] as const;


export function calculateGoaProgressPercentage({
    totalPoints,
    programMaxPoints,
    lastGoaMileStoneNotified = 0,
}: GoaProgressInput) {
    // 1️⃣ Calculate % (same as before)
    const percentage = Math.min(
        100,
        Math.floor((totalPoints / programMaxPoints) * 100)
    );

    // 2️⃣ Determine next milestone crossed 
    const crossedMilestone =
        GOA_MILESTONES.find(
            (m) => percentage >= m && m > lastGoaMileStoneNotified
        ) ?? null;


    return {
        progressPercentage: percentage,
        crossedMilestone,
    };
}
