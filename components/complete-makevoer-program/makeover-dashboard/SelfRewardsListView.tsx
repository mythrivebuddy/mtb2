"use client";

import { CheckCircle, Gift, Lock } from "lucide-react";
import { RewardItem } from "./BonusRewards";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { RewardsResponse } from "./SelfRewardsCustomizeView";

type ClaimPayload = {
  programId: string;
  checkpointId: string;
  rewardOptionId?: string;
};

export const SelfRewardsListView = ({
  rewards,
  programId,
}: {
  rewards: RewardItem[];
  programId: string;
}) => {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: async (payload: ClaimPayload) => {
      const { data } = await axios.post(
        "/api/makeover-program/makeover-self-rewards/user-selection",
        payload,
        {
          withCredentials: true,
        },
      );
      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.setQueryData(["bonus-rewards", programId], (oldData: InfiniteData<RewardsResponse> | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item: RewardItem) =>
              item.checkpointId === variables.checkpointId
                ? { ...item, status: "completed" }
                : item,
            ),
          })),
        };
      });

      const claimedReward = rewards.find(
        (r) => r.checkpointId === variables.checkpointId,
      );

      const optionTitle = claimedReward?.options?.find(
        (o) => o.id === variables.rewardOptionId,
      )?.title;

      toast.success(
        optionTitle
          ? `${optionTitle} reward claimed`
          : "Your reward has been marked as claimed",
      );
      //clearing selected option for this checkpoint
      setSelected((prev) => {
        const next = { ...prev };
        delete next[variables.checkpointId];
        return next;
      });
    },
  });

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
                  {reward.status === "unlocked" &&
                    reward.options &&
                    (() => {
                      const requiresOption = reward.options.length > 0;

                      return (
                        <div className="my-4 space-y-3">
                          {reward.options.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex items-start gap-2 text-sm cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={reward.checkpointId}
                                checked={
                                  selected[reward.checkpointId] === opt.id
                                }
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
                              </div>
                            </label>
                          ))}

                          {/* Claim button */}
                          <Button
                            disabled={
                              (requiresOption &&
                                !selected[reward.checkpointId]) ||
                              claimMutation.isPending
                            }
                            onClick={() =>
                              claimMutation.mutate({
                                programId,
                                checkpointId: reward.checkpointId,
                                rewardOptionId: requiresOption
                                  ? selected[reward.checkpointId]
                                  : undefined,
                              })
                            }
                            className={`mt-2 w-full text-xs font-semibold px-3 py-1 rounded-md ${
                              requiresOption && selected[reward.checkpointId]
                                ? "bg-[#1183d4] hover:bg-[#0c62a0] text-white"
                                : !requiresOption
                                  ? "bg-[#1183d4] hover:bg-[#0c62a0] text-white"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {claimMutation.isPending &&
                            claimMutation.variables?.checkpointId ===
                              reward.checkpointId
                              ? "Claiming..."
                              : "Claim"}
                          </Button>
                        </div>
                      );
                    })()}

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
