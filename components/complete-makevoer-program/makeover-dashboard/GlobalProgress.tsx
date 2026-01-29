import { PlaneTakeoff, Medal } from "lucide-react";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";
import { prisma } from "@/lib/prisma";
import { evaluateLevel } from "@/lib/utils/makeover-program/awards/evaluateLevel";
import { awardMilestoneBadges } from "@/lib/utils/makeover-program/awards/awardMilestoneBadges";
import {
  getBadgeStyles,
  resolveLevelIcon,
} from "@/lib/utils/makeover-program/achievements/resolve-badges-levels-icons";
import Link from "next/link";
import { calculateGoaProgressPercentage } from "@/lib/utils/makeover-program/makeover-dashboard/goa";

const GlobalProgress = async ({
  userId,
  programId,
  programMaxPoints,
}: {
  userId: string;
  programId: string;
  programMaxPoints: number;
}) => {
  const aggregate = await prisma.makeoverPointsSummary.aggregate({
    where: {
      userId,
      programId,
    },
    _sum: {
      totalPoints: true,
    },
  });

  const globalPoints = aggregate._sum.totalPoints ?? 0;

  // 2️⃣ Evaluate LEVEL (guarded internally)
  await evaluateLevel(userId, programId, globalPoints);

  // 3️⃣ Evaluate MILESTONE BADGES (guarded internally)
  await awardMilestoneBadges(userId, programId, globalPoints);
  const currentLevel = await prisma.makeoverLevel.findFirst({
    where: {
      users: {
        some: {
          userId,
          programId,
        },
      },
    },
    orderBy: {
      minPoints: "desc", // IMPORTANT: highest unlocked level
    },
  });

  const allLevels = await prisma.makeoverLevel.findMany({
    orderBy: { minPoints: "asc" },
  });

  const currentLevelIndex = allLevels.findIndex(
    (l) => l.id === currentLevel?.id,
  );

  const nextLevel = allLevels[currentLevelIndex + 1] ?? null;

  // Calculate progress to next level
  const currentMin = currentLevel?.minPoints ?? 0;
  const nextMin = nextLevel?.minPoints ?? currentMin;

  const completedPercent =
    nextLevel && nextMin > currentMin
      ? ((globalPoints - currentMin) / (nextMin - currentMin)) * 100
      : 100;

  const remainingToNextLevel = Math.max(
    0,
    Math.min(100, 100 - Math.floor(completedPercent)),
  );

  // Calculate remaining points (nice UX)

  const levelName = currentLevel?.name ?? "Initiator";
  const levelId = currentLevel?.id ?? 0;
  const unlockedBadges = await prisma.makeoverBadge.findMany({
    where: {
      users: {
        some: {
          userId,
          programId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      icon: true,
    },
  });

  const progressPercentage = calculateGoaProgressPercentage({
    totalPoints: globalPoints,
    // levelId,
    // earnedBadgesCount: unlockedBadges.length,
    programMaxPoints,
  });

  const levelInBadges = `${currentLevel?.name} Badge`;

  const LevelIcon = currentLevel?.icon
    ? resolveLevelIcon(currentLevel.icon)
    : Medal;
  const {
    colorClass: levelColor,
    bgClass: levelBg,
    ringClass: levelRing,
  } = getBadgeStyles(
    levelInBadges ?? "Initiator",
    "LEVEL",
    true, // current level is always unlocked
  );

  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
      <StaticDataBadge
        label="Progress Journey "
        className="w-fit relative -top-10 -left-11 "
      />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 sm:mb-4 gap-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PlaneTakeoff className="w-6 h-6 text-[#1183d4]" />
          Goa Journey Progress
        </h3>
      </div>
      {/* Wrapper*/}
      <div className="relative mb-6">
        {/* 75% Eligibility Marker (OUTSIDE clipped bar) */}
        <div
          className="absolute top-0 h-6 z-30 pointer-events-none"
          style={{ left: "75%" }}
        >
          <div className="relative -translate-x-1/2 h-full flex flex-col items-center">
            <span
              className="absolute -top-7 whitespace-nowrap text-[8px] sm:text-[10px]
        font-semibold text-white bg-[#1183d4] px-2 py-0.5 rounded-full shadow-sm"
            >
              75% Min Eligibility
            </span>
            <div className="h-full w-1 bg-amber-500 shadow-inner" />
          </div>
        </div>

        {/* Progress Bar — clipped */}
        <div className="relative h-6 bg-[#059669] dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-[#1183d4] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Percentage */}
          <span className="absolute top-0 left-2 h-full flex items-center text-xs font-bold text-white">
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="flex gap-6 justify-between items-center w-full mb-6 px-1">
        <p className="text-sm font-bold text-[#0f2cbd] dark:text-white">
          {(globalPoints ?? 0).toLocaleString()} MoS
        </p>
        <span className="flex flex-col sm:flex-row text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>Target:</span>
          <span>December 2026</span>
        </span>
        <p className="text-sm font-bold text-[#0f2cbd] dark:text-white">
          Max: {programMaxPoints.toLocaleString()} MoS
        </p>
      </div>
      <Link
        href={`/dashboard/complete-makeover-program/achievements`}
        className="flex flex-col sm:flex-row sm:justify-between gap-6 pt-2 border-t border-slate-100 "
      >
        <div className="flex items-start gap-4">
          <div
            className={`size-12 rounded-full flex items-center justify-center shrink-0 ring-2 mt-2
      ${levelBg} ${levelRing}`}
          >
            <LevelIcon className={levelColor} size={26} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">
              Current Level
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              Level {levelId} {levelName}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {nextLevel
                ? `${remainingToNextLevel}% remaining to unlock next level`
                : "Final level reached 🎉"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 max-w-[560px] w-full">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide text-center">
            Badges Unlocked
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {unlockedBadges.map((badge) => {
              // const isUnlocked = true;
              // const isUnlocked = badge.users.length > 0;
              const BadgeIcon = resolveLevelIcon(badge.icon);

              const { colorClass, bgClass, ringClass } = getBadgeStyles(
                badge.name,
                badge.type,
                true,
              );

              return (
                <div
                  key={badge.id}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <div
                    className={`size-12 rounded-full flex items-center justify-center mb-1 ${bgClass} ${colorClass} ${ringClass}`}
                  >
                    <BadgeIcon size={24} />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                    {badge.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </section>
  );
};

export default GlobalProgress;
