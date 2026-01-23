"use client";

import { useState } from "react";
import axios from "axios";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { CheckCircle, Gift, Star } from "lucide-react";
import { RewardItem } from "./BonusRewards";

export type RewardsResponse = {
  items: RewardItem[];
  nextCursor: number | null;
};

export const SelfRewardsCustomizeView = ({
  rewards,
  programId,
}: {
  rewards: RewardItem[];
  programId: string;
}) => {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const editRewardMutation = useMutation({
    mutationFn: async (payload: {
      programId: string;
      checkpointId: string;
      customTitle: string;
    }) => {
      const { data } = await axios.patch(
        "/api/makeover-program/makeover-self-rewards/custom-reward",
        payload,
        { withCredentials: true },
      );
      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        ["bonus-rewards", variables.programId],
        (oldData: InfiniteData<RewardsResponse> | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item: RewardItem) =>
                item.checkpointId === variables.checkpointId
                  ? {
                      ...item,
                      groupTitle: variables.customTitle,
                      //  DO NOT TOUCH status
                    }
                  : item,
              ),
            })),
          };
        },
      );

      toast.success(`Reward updated to "${variables.customTitle}"`);

      setEditingId(null);
      setDraftTitle("");
    },
  });

  return (
    <>
      {rewards.map((reward) => {
        const isEditing = editingId === reward.checkpointId;
        const isUnlocked =
          reward.status === "unlocked" || reward.status === "completed";
        const isHighlightedUnlocked = reward.status === "unlocked";

        return (
          <div
            key={reward.checkpointId}
            className={`rounded-lg border flex justify-between  px-4 py-3 space-y-3
            ${
              isHighlightedUnlocked
                ? "bg-gradient-to-r from-yellow-300 to-amber-100"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {/* LEFT */}
            <div className="flex items-start gap-3 flex-1">
              <Gift
                className={`w-5 h-5 ${
                  isUnlocked ? "text-[#1183d4]" : "text-slate-400"
                }`}
              />

              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="
          w-full sm:flex-1
          text-sm font-medium
          bg-transparent
          border-b border-slate-300
          focus:outline-none focus:border-[#1183d4]
        "
                      autoFocus
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        disabled={
                          !draftTitle.trim() || editRewardMutation.isPending
                        }
                        onClick={() =>
                          editRewardMutation.mutate({
                            programId,
                            checkpointId: reward.checkpointId,
                            customTitle: draftTitle.trim(),
                          })
                        }
                        className={`
            px-3 py-1.5 text-xs font-semibold rounded-md
            transition-all
            ${
              draftTitle.trim()
                ? "bg-[#1183d4] text-white hover:bg-[#0f72b8] shadow-sm"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }
          `}
                      >
                        {editRewardMutation.isPending ? "Saving…" : "Save"}
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setDraftTitle("");
                        }}
                        disabled={editRewardMutation.isPending}
                        className="
            px-3 py-1.5 text-xs font-semibold rounded-md
            bg-slate-100 text-slate-600
            hover:bg-slate-200
            transition-all
          "
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {reward.groupTitle}
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  {reward.status === "completed" ? "Claimed" : "Unlocks"} at{" "}
                  {reward.minPoints} points
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {isHighlightedUnlocked && (
                <Star className="w-6 h-6  text-amber-400  fill-current" />
              )}
              {reward.status === "completed" && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}

              {reward.canEdit && !isEditing && (
                <button
                  onClick={() => {
                    setEditingId(reward.checkpointId);
                    setDraftTitle(reward.groupTitle);
                  }}
                  className="text-xs font-semibold text-[#1183d4] hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};
