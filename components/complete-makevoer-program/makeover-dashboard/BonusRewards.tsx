"use client";

import { Sparkles, Lock, ArrowLeft } from "lucide-react";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";

import axios from "axios";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SelfRewardsListView } from "./SelfRewardsListView";
import { SelfRewardsCustomizeView } from "./SelfRewardsCustomizeView";
import SelfRewardsSkeleton from "./SelfRewardsSkeleton";

/* ---------------- types ---------------- */

type RewardStatus = "locked" | "unlocked" | "completed";
type ViewMode = "list" | "customize";

export interface RewardItem {
  checkpointId: string;
  minPoints: number;
  groupTitle: string;
  groupDescription?: string;
  status: RewardStatus;
  canEdit: boolean;
  options:[
    {
      id:string;
      title: string;
      description: string;
    }
  ]
}

interface RewardsResponse {
  items: RewardItem[];
  nextCursor: number | null;
}

/* ---------------- axios ---------------- */

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/* ---------------- props ---------------- */

interface BonusRewardsProps {
  isProgramStarted: boolean;
  programId: string;
}

/* ======================================================
   MAIN COMPONENT (SCROLL + OBSERVER LIVE HERE)
====================================================== */

const BonusRewards = ({ isProgramStarted, programId }: BonusRewardsProps) => {
  const [view, setView] = useState<ViewMode>("list");

  /* ---------- react-query (UNCHANGED) ---------- */

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<
      RewardsResponse,
      Error,
      InfiniteData<RewardsResponse, number | null>,
      string[],
      number | null
    >({
      queryKey: ["bonus-rewards", programId],
      initialPageParam: null,
      queryFn: async ({ pageParam }) => {
        const res = await api.get<RewardsResponse>(
          "/makeover-program/makeover-self-rewards/predefined-library",
          {
            params: {
              programId,
              cursor: pageParam ?? undefined,
            },
          },
        );
        return res.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!programId && isProgramStarted,
    });

  /* ---------- infinite scroll (UNCHANGED) ---------- */

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (!scrollArea) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      { root: scrollArea, rootMargin: "40px" },
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

const unlockCalledRef = useRef(false);

useEffect(() => {
  if (!isProgramStarted || !programId) return;
  if (unlockCalledRef.current) return;

  unlockCalledRef.current = true;

  api.get("/makeover-program/makeover-self-rewards/unlock-reward", {
    params: { programId },
  }).catch(() => {
    console.log("failed to unlock new reward");
  });
}, [isProgramStarted, programId]);



  /* ---------- flatten pages ---------- */

  const rewards: RewardItem[] = data?.pages.flatMap((p) => p.items) ?? [];

  /* ---------------- UI ---------------- */
  if (isLoading) {
    return (
      <section className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative h-[320px]">
        <StaticDataBadge
          label="Your rewards"
          className="w-fit absolute -top-1.5 -left-3"
        />

        {/* Header stays visible */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            Self Rewards
          </h3>
        </div>

        {/* Skeleton list */}
        <div className="flex flex-col gap-3">
          <SelfRewardsSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative h-[320px]">
      <StaticDataBadge
        label="Your rewards"
        className="w-fit absolute -top-1.5 -left-3"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          {view === "list" ? "Self Rewards" : "Customize Rewards"}
        </h3>

        {isProgramStarted &&
          (view === "list" ? (
            <button
              onClick={() => setView("customize")}
              className="text-xs font-semibold text-[#1183d4] hover:underline"
            >
              Customize Rewards
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              className=" flex items-center text-xs font-semibold text-[#1183d4] hover:underline"
            >
              <ArrowLeft size={14}/> Back
            </button>
          ))}
      </div>

      {/* Content */}
      {!isProgramStarted ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-slate-500 text-center flex-1">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-6 h-6 opacity-60" />
          </div>

          <p className="text-md font-medium">Rewards unlock very soon</p>
          <p className="text-md italic max-w-xs">
            Complete daily actions and stay consistent to earn rewards once the
            program begins.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 pr-2">
          <div className="flex flex-col gap-3">
            {view === "list" ? (
              <SelfRewardsListView rewards={rewards} programId={programId}/>
            ) : (
              <SelfRewardsCustomizeView rewards={rewards} programId={programId}/>
            )}

            {/* infinite scroll trigger — DO NOT MOVE */}
            <div ref={observerRef} />

            {isFetchingNextPage && (
              <p className="text-xs text-center text-slate-400">
                Loading more…
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </section>
  );
};

export default BonusRewards;
