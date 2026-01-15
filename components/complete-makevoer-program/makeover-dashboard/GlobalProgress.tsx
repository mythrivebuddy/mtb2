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

const GlobalProgress = async ({
  userId,
  programId,
}: {
  userId: string;
  programId: string;
}) => {
  const progressPercentage = 0; // Example static value

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
    (l) => l.id === currentLevel?.id
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
    Math.min(100, 100 - Math.floor(completedPercent))
  );

  // Calculate remaining points (nice UX)
  const nextLevelXPNeeded =
    nextLevel && globalPoints < nextMin
      ? `${nextMin - globalPoints} MoS`
      : "Completed";

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
    true // current level is always unlocked
  );

  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
      <StaticDataBadge
        label="Progress Journey "
        className="w-fit relative -top-10 -left-11 "
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PlaneTakeoff className="w-6 h-6 text-[#1183d4]" />
          Goa Journey Progress
        </h3>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Target: December 2026
        </span>
      </div>
      <div className="relative h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6 shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-[#1183d4] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
        </div>
        <span
          className={`absolute top-0 left-2 h-full flex items-center text-xs font-bold ${progressPercentage === 0 ? "text-slate-500" : "text-white"} pl-1 drop-shadow-md`}
        >
          {progressPercentage}%
        </span>
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
                true
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
