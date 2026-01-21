import { CheckCircle, Gift, Lock } from "lucide-react";
import { RewardItem } from "./BonusRewards";

export const SelfRewardsListView = ({ rewards }: { rewards: RewardItem[] }) => {
  return (
    <>
      {rewards.map((reward) => {
        const isUnlocked =
          reward.status === "unlocked" || reward.status === "completed";

        return (
          <div
            key={reward.checkpointId}
            className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
          >
            {/* Left side: Gift + text */}
            <div className="flex items-center gap-3">
              <Gift
                className={`w-5 h-5 ${
                  isUnlocked ? "text-[#1183d4]" : "text-slate-400"
                }`}
              />

              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {reward.groupTitle}
                </p>
                <p className="text-xs text-slate-500">
                  Unlocks at {reward.minPoints} pts
                </p>
              </div>
            </div>

            {/* Right side: status */}
            {reward.status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}

            {reward.status === "unlocked" && (
              <span className="text-xs font-semibold text-[#1183d4]">
                Choose
              </span>
            )}

            {reward.status === "locked" && (
              <Lock className="w-5 h-5 text-slate-400" />
            )}
          </div>
        );
      })}
    </>
  );
};
