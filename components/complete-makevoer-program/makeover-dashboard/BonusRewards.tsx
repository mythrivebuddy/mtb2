import { Sparkles, Gift, Lock } from "lucide-react";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";

const BonusRewards = () => {
  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
      <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          Bonus & Rewards
        </h3>
        <button className="text-xs font-semibold text-[#1183d4] hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
          <div className="size-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-[#10B981]">
            <Gift className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Next Self-Reward: Spa Weekend
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#10B981] h-1.5 rounded-full"
                style={{ width: "80%" }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Unlock at 500 total points (420/500)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3 rounded-lg opacity-70">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Monthly Bonus: 1:1 Coaching Call
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Complete 90% of habit logs to unlock
            </p>
          </div>
          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded uppercase">
            Locked
          </span>
        </div>
      </div>
    </section>
  );
};

export default BonusRewards;
