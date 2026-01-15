import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Medal, Brain, Lightbulb } from "lucide-react";
import { getServerSession } from "next-auth";

import ShareAchievementButton from "@/components/complete-makevoer-program/Achievements/ShareAchievementButton";
import { getBadgeStyles, resolveLevelIcon } from "@/lib/utils/makeover-program/achievements/resolve-badges-levels-icons";

export const metadata = {
  title: "Makeover Achievements",
  description:
    "View your growth ladder, progress toward the next level, and unlocked achievement badges in your transformation journey.",
  icons: {
    icon: "/favicon.ico",
    // shortcut: "/favicon.ico",
  },
};



export default async function MakeoverAchievementsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const program = await prisma.program.findFirst({
    where: {
      slug: "2026-complete-makeover",
    },
  });
  const programId = program?.id;
  const allLevels = await prisma.makeoverLevel.findMany({
    orderBy: { id: "asc" },
    include: {
      users: {
        where: { userId, programId },
      },
    },
  });
  const globalPoints = await prisma.makeoverPointsSummary.aggregate({
    where: { userId, programId },
    _sum: {
      totalPoints: true,
    },
  });

  const currentUserLevel =
    allLevels.find((l) => l.users.length > 0) ?? allLevels[0];

  const currentLevelId = currentUserLevel?.id;

  const totalPoints = globalPoints._sum.totalPoints ?? 0;

  const currentLevelIndex = allLevels.findIndex((l) => l.id === currentLevelId);

  const currentLevel = allLevels[currentLevelIndex];
  const nextLevel = allLevels[currentLevelIndex + 1] ?? null;

  const currentMin = currentLevel?.minPoints ?? 0;
  const nextMin = nextLevel?.minPoints ?? currentMin;

  const rawProgress =
    nextMin > currentMin
      ? ((totalPoints - currentMin) / (nextMin - currentMin)) * 100
      : 100;

  const nextLevelProgress = Math.min(Math.max(Math.floor(rawProgress), 0), 100);

  const nextLevelXPNeeded =
    nextLevel && totalPoints < nextMin
      ? `${nextMin - totalPoints} MoS`
      : "Completed";

  const USER_PROGRESS = {
    currentLevel: currentLevelId,
    levelName: currentUserLevel?.name ?? "Initiator",
    globalPoints,
    nextLevelProgress,
    nextLevelXPNeeded,
  };

  const allBadges = await prisma.makeoverBadge.findMany({
    
    include: {
      users: {
        where: { userId, programId },
      },
    },
  });

  return (
    <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 lg:px-10 py-8 font-sans">
      {/* Page Header */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0f2cbd]/10 text-[#0f2cbd] text-xs font-bold uppercase tracking-wider">
              Level {USER_PROGRESS.currentLevel}
            </span>
            <span className="text-[#4c599a] text-sm">
              {USER_PROGRESS.levelName}
            </span>
          </div>
          <h1 className="text-[#0d101b] dark:text-white text-3xl md:text-4xl font-black tracking-tight">
            Your Transformation Journey
          </h1>
          <p className="text-[#4c599a] dark:text-gray-400 text-base md:text-lg leading-relaxed">
            Track your evolution from Initiator to Identity Master. You are
            building momentum.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0f2cbd] dark:text-white">
              {USER_PROGRESS.globalPoints._sum.totalPoints} MoS
            </p>

            <p className="text-xs text-[#4c599a] font-medium">
              Total Experience
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Growth Ladder (Timeline) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1a1d2d] rounded-2xl p-2 md:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-[#0d101b] dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-[#0f2cbd]" size={24} /> Growth Ladder
            </h3>

            <div className="relative">
              {allLevels.map((level, index) => {
                const isLast = index === allLevels.length - 1;
                const isCompleted = index < currentLevelIndex;
                const isActive = level.id === currentLevelId;
                const Icon = resolveLevelIcon(level.icon);

                // --- COMPLETED STATE ---
                if (isCompleted && !isActive) {
                  return (
                    <div
                      key={level.id}
                      className="grid grid-cols-[48px_1fr] gap-x-4 relative group"
                    >
                      {/* Vertical Line */}
                      {!isLast && (
                        <div className="absolute left-[23px] top-10 bottom-[-20px] w-0.5 bg-[#059669]/30 h-full z-0"></div>
                      )}

                      {/* Icon Node */}
                      <div className="relative z-10 flex flex-col items-center pt-1">
                        <div className="rounded-full bg-white dark:bg-[#1a1d2d]">
                          <div className="size-12 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] border-2 border-[#059669]/20">
                            <Icon size={24} />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pb-10 pt-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[#0d101b] dark:text-white text-lg font-bold">
                              {level.name}
                            </h4>
                            <p className="text-[#4c599a] dark:text-gray-500 text-sm mt-1">
                              {level.levelTheme}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- ACTIVE STATE ---
                if (isActive) {
                  return (
                    <div
                      key={level.id}
                      className="grid grid-cols-[48px_1fr] gap-x-4 relative"
                    >
                      {/* Vertical Line (Dashed) */}
                      {!isLast && (
                        <div className="absolute left-[23px] top-10 bottom-[-40px] w-0.5 bg-gray-200 dark:bg-gray-700 border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-full z-0"></div>
                      )}

                      {/* Icon Node */}
                      <div className="relative z-10 flex flex-col items-center pt-1">
                        <div className="rounded-full bg-white dark:bg-[#1a1d2d]">
                          <div className="size-12 rounded-full bg-[#0f2cbd] text-white flex items-center justify-center shadow-lg shadow-[#0f2cbd]/30 ring-4 ring-white dark:ring-[#101322]">
                            <Icon size={24} />
                          </div>
                        </div>
                      </div>

                      <div className="pb-12 pt-0">
                        {/* Active Card Styling */}
                        <div className="bg-[#0f2cbd]/5 dark:bg-[#0f2cbd]/10 border border-[#0f2cbd]/20 rounded-xl p-5 shadow-sm mt-1 relative overflow-hidden">
                          {/* Decorative background blob */}
                          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#0f2cbd]/10 rounded-full blur-2xl pointer-events-none"></div>

                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                              <h4 className="text-[#0f2cbd] dark:text-blue-400 text-xl font-bold">
                                {level.name}
                              </h4>
                              <p className="text-[#0d101b] dark:text-gray-300 text-sm mt-1 font-medium">
                                {level.levelTheme}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-[#0f2cbd] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold uppercase tracking-wide rounded border border-blue-200 dark:border-blue-800">
                              Current Level
                            </span>
                          </div>

                          <div className="mt-4 relative z-10">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-[#4c599a] dark:text-gray-400">
                                Progress to {nextLevel?.name ?? "Final Level"}
                              </span>
                              <span className="font-bold text-[#0d101b] dark:text-white">
                                {USER_PROGRESS.nextLevelProgress}%
                              </span>
                            </div>
                            <div className="h-3 w-full bg-white dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-[#0f2cbd] rounded-full relative"
                                style={{
                                  width: `${USER_PROGRESS.nextLevelProgress}%`,
                                }}
                              >
                                <div className="absolute top-0 bottom-0 right-0 w-full bg-gradient-to-l from-white/20 to-transparent"></div>
                              </div>
                            </div>
                            <p className="text-xs text-[#4c599a] dark:text-gray-500 mt-2">
                              <span className="text-[#0f2cbd] font-bold">
                                {USER_PROGRESS.nextLevelXPNeeded}
                              </span>{" "}
                              needed to unlock next level
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-[#0f2cbd]/10 flex gap-3">
                            {/* <button className="flex-1 bg-[#0f2cbd] hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm">
                              Share with your friends/network
                            </button> */}
                            <ShareAchievementButton
                              userId={userId!}
                              shareText={`I just reached ${currentUserLevel.name} level in my transformation journey 🚀`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- LOCKED STATE (FIXED) ---
                return (
                  <div
                    key={level.id}
                    // FIX: Removed opacity-60 from parent so the background mask stays opaque
                    className="grid grid-cols-[48px_1fr] gap-x-4 relative"
                  >
                    {!isLast && (
                      <div className="absolute left-[23px] top-10 bottom-[-20px] w-0.5 bg-gray-200 dark:bg-gray-700 h-full z-0"></div>
                    )}

                    <div className="relative z-10 flex flex-col items-center pt-1">
                      {/* Masking div - Stays opaque to hide the line */}
                      <div className="rounded-full bg-white dark:bg-[#1a1d2d]">
                        {/* Visual Icon Circle - Looks locked/disabled */}
                        <div className="size-12 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700">
                          <Icon size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Content - applied opacity here instead */}
                    <div className="pb-10 pt-2 opacity-60 grayscale">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[#0d101b] dark:text-white text-lg font-bold">
                            {level.name}
                          </h4>
                          <p className="text-[#4c599a] dark:text-gray-500 text-sm mt-1">
                            {level.levelTheme}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-semibold rounded">
                          Locked
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Summary */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* Badge Grid Section */}
          <div className="bg-white dark:bg-[#1a1d2d] rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0d101b] dark:text-white flex items-center gap-2">
                <Medal className="text-[#D97706]" size={24} />
                Level Badges
              </h3>
              <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-[#4c599a] px-2 py-1 rounded">
                {allBadges.filter((b) => b.users.length > 0).length}/
                {allBadges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* LEVEL BADGES */}
              {allBadges
                .filter((badge) => badge.type === "LEVEL")
                .map((badge) => {
                  const isUnlocked = badge.users.length > 0;
                  const BadgeIcon = resolveLevelIcon(badge.icon);

                  const { colorClass, bgClass, ringClass } = getBadgeStyles(
                    badge.name,
                    badge.type,
                    isUnlocked
                  );

                  if (isUnlocked) {
                    return (
                      <div
                        key={badge.id}
                        className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div
                          className={`size-12 sm:size-14 rounded-full flex items-center justify-center mb-1 ring-2 ${bgClass} ${colorClass} ${ringClass}`}
                        >
                          <BadgeIcon size={28} />
                        </div>
                        <span className="text-xs font-bold text-center text-[#0d101b] dark:text-gray-200 leading-tight">
                          {badge.name.replace(/badge/gi, "").trim()}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                          {badge.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                        </div>
                      </div>
                    );
                  }

                  // LOCKED LEVEL BADGE
                  return (
                    <div
                      key={badge.id}
                      className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed grayscale"
                    >
                      <div
                        className={`size-12 sm:size-14 rounded-full flex items-center justify-center mb-1 ${bgClass} ${colorClass}`}
                      >
                        <BadgeIcon size={28} />
                      </div>
                      <span className="text-xs font-bold text-center text-gray-500 dark:text-gray-400 leading-tight">
                        {badge.name.replace(/badge/gi, "").trim()}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                        <span className="text-gray-400 uppercase text-[10px] block mb-1">
                          Locked
                        </span>
                        {badge.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                      </div>
                    </div>
                  );
                })}

              {/* DIVIDER */}

              <div className="col-span-3 my-4 h-px bg-gray-200 dark:bg-gray-700" />
              <h3 className="col-span-3 text-xl font-bold text-[#0d101b] dark:text-white flex items-center gap-2">
                <Medal className="text-[#D97706]" size={24} /> Milestone Badges
              </h3>

              {/* MILESTONE BADGES */}
              {allBadges
                .filter((badge) => badge.type === "MILESTONE")
                .map((badge) => {
                  const isUnlocked = badge.users.length > 0;
                  const BadgeIcon = resolveLevelIcon(badge.icon);

                  const { colorClass, bgClass, ringClass } = getBadgeStyles(
                    badge.name,
                    badge.type,
                    isUnlocked
                  );

                  if (isUnlocked) {
                    return (
                      <div
                        key={badge.id}
                        className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div
                          className={`size-12 sm:size-14 rounded-full flex items-center justify-center mb-1 ring-2 ${bgClass} ${colorClass} ${ringClass}`}
                        >
                          <BadgeIcon size={28} />
                        </div>
                        <span className="text-xs font-bold text-center text-[#0d101b] dark:text-gray-200 leading-tight">
                          {badge.name.replace(/badge/gi, "").trim()}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                          {badge.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                        </div>
                      </div>
                    );
                  }

                  // LOCKED MILESTONE BADGE
                  return (
                    <div
                      key={badge.id}
                      className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed grayscale"
                    >
                      <div
                        className={`size-12 sm:size-14 rounded-full flex items-center justify-center mb-1 ${bgClass} ${colorClass}`}
                      >
                        <BadgeIcon size={28} />
                      </div>
                      <span className="text-xs font-bold text-center text-gray-500 dark:text-gray-400 leading-tight">
                        {badge.name.replace(/badge/gi, "").trim()}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                        <span className="text-gray-400 uppercase text-[10px] block mb-1">
                          Locked
                        </span>
                        {badge.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Motivation/Tip Widget */}
          <div className="bg-gradient-to-br from-[#0f2cbd] to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={20} />
                <span className="text-sm font-bold uppercase tracking-wide opacity-80">
                  Pro Tip
                </span>
              </div>
              <p className="font-medium text-lg leading-snug mb-4">
                "Consistency beats intensity. It's better to do 5 minutes daily
                than 1 hour once a week."
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
