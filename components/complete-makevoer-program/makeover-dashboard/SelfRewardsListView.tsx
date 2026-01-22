"use client";
import { CheckCircle, Gift, Lock } from "lucide-react";
import { RewardItem } from "./BonusRewards";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const SelfRewardsListView = ({ rewards }: { rewards: RewardItem[] }) => {
  const [selected, setSelected] = useState<Record<string, string>>({});
  return (
    <>
      {rewards.map((reward) => {
        const isUnlocked =
          reward.status === "unlocked" || reward.status === "completed";

        return (
          <div
            key={reward.checkpointId}
            className="rounded-lg border flex justify-between border-slate-200 dark:border-slate-700 px-4 py-3 space-y-3"
          >
            {/* Left side: Gift + text */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Gift
                  className={`w-5 h-5 ${
                    isUnlocked ? "text-[#1183d4]" : "text-slate-400"
                  }`}
                />

                <div className="">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {reward.groupTitle}
                  </p>
                  {reward.status === "unlocked" && reward.options && (
                    <div className="my-4 space-y-3">
                      {reward.options.map((opt) => (
                        <label
                          key={opt.id}
                          className="flex items-start gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={reward.checkpointId}
                            checked={selected[reward.checkpointId] === opt.id}
                            onChange={() =>
                              setSelected((prev) => ({
                                ...prev,
                                [reward.checkpointId]: opt.id,
                              }))
                            }
                            className="mt-1"
                          />
                          <div>
                            <p className="text-slate-900 dark:text-white">
                              {opt.title}
                            </p>
                            {/* <p className="text-xs text-slate-500">
                              {opt.description}
                            </p> */}
                          </div>
                        </label>
                      ))}

                      {/* Claim button */}
                      <Button
                        disabled={!selected[reward.checkpointId]}
                        className={`mt-2 w-full text-xs font-semibold px-3 py-1 rounded-md ${
                          selected[reward.checkpointId]
                            ? "bg-[#1183d4] text-white"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Claim
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    Unlocks at {reward.minPoints} pts
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: status */}
            {reward.status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
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
