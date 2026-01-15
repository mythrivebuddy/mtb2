import { PlaneTakeoff, Medal, Brain } from "lucide-react";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateLevel } from "@/lib/utils/makeover-program/awards/evaluateLevel";
import { awardMilestoneBadges } from "@/lib/utils/makeover-program/awards/awardMilestoneBadges";

const GlobalProgress = async ({
  userId,
  programId,
}: {
  userId: string;
  programId: string;
}) => {
  const progressPercentage = 0; // Example static value
  const session = await getServerSession(authOptions);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
            <Medal className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
              Current Level
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              Level 0
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Next level at 30% completion
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
              Current Level Identity
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              Initiator
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Focus: Daily small wins over big leaps.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalProgress;
