"use client";

import { CheckCircle, Gift, Lock, Star } from "lucide-react";
import { RewardItem } from "./BonusRewards";
import { useState } from "react";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
      queryClient.setQueryData(
        ["bonus-rewards", programId],
        (oldData: InfiniteData<RewardsResponse> | undefined) => {
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
        },
      );

      const claimedReward = rewards.find(
        (r) => r.checkpointId === variables.checkpointId,
      );

      const optionTitle = claimedReward?.options?.find(
        (o) => o.id === variables.rewardOptionId,
      )?.title;

      toast.success(
        optionTitle
          ? `${optionTitle} reward has been claimed`
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
        const isHighlightedUnlocked = reward.status === "unlocked";
        
        // This variable prevents the TypeScript strict-comparison error
        const requiresOption = (reward.options?.length ?? 0) > 0;

        return (
          <div
            key={reward.checkpointId}
            className={`rounded-lg border flex justify-between px-4 py-3
            ${
              isHighlightedUnlocked
                ? "bg-gradient-to-r from-yellow-300 to-amber-100"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {/* Left side: Gift + text */}
            <div className="flex items-start justify-between w-full">
              <div className="flex items-start gap-3 w-full">
                <Gift
                  className={`w-5 h-5 flex-shrink-0 ${
                    isUnlocked ? "text-[#1183d4]" : "text-slate-400"
                  }`}
                />

                <div className="w-full">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {reward.groupTitle}
                  </p>

                 {/* Conditional Desktop Layout for "unlocked" state */}
                  {reward.status === "unlocked" ? (
                    <div className="flex flex-col md:flex-row w-full mt-3 gap-3">
                      {/* Left Column: Options */}
                      {/* CHANGED: Replaced 'sm:max-w-[60%]' with 'w-full md:w-[60%] flex-shrink-0' to lock the width and align all buttons */}
                      <div className="space-y-3 w-full md:w-[60%] flex-shrink-0">
                        {reward.options?.map((opt) => (
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
                              <p className="text-xs sm:text-sm text-slate-900 dark:text-white">
                                {opt.title}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Right Column: Claim Button + Unlocks text */}
                      <div className="flex flex-col gap-3 md:items-start w-full md:w-32">
                        <button
                          disabled={
                            (requiresOption && !selected[reward.checkpointId]) ||
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
                          className={`w-full text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${
                            (requiresOption && selected[reward.checkpointId]) || !requiresOption
                              ? "bg-[#1183d4] hover:bg-[#0c62a0] text-white shadow-md"
                              : "bg-[#1183d4] hover:bg-[#0c62a0] text-white opacity-80 cursor-not-allowed"
                          }`}
                        >
                          {claimMutation.isPending &&
                          claimMutation.variables?.checkpointId ===
                            reward.checkpointId
                            ? "Claiming..."
                            : "Claim"}
                        </button>
                        <p className="text-xs text-slate-500 text-center md:text-left">
                          Unlocked at {reward.minPoints} points
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Default layout for "locked" and "completed"
                    <p className="text-xs  text-slate-500 mt-1">
                      {reward.status === "completed" ? "Claimed" : "Unlocks"} at{" "}
                      {reward.minPoints} points
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: status icons */}
            {isHighlightedUnlocked && (
              <Star className="w-6 h-6 ml-2 text-amber-400 fill-current flex-shrink-0" />
            )}
            {reward.status === "completed" && (
              <CheckCircle className="w-5 h-5 ml-2 text-green-500 flex-shrink-0" />
            )}

            {reward.status === "locked" && (
              <Lock className="w-5 h-5 ml-2 text-slate-400 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </>
  );
};