"use client";

import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";
import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface AreaCardProps {
  title: string;
  label: string;
  goal: string;
  progress: number;
  // points: number; // kept for compatibility
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  challengeIds: string[];
  areaId: number;
}

interface MakeoverPointsSummary {
  areaId: number;
  totalPoints: number;
}

/* ---------------- Skeleton ---------------- */
const AreaCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 py-2 px-5 animate-pulse">
      <div className="h-5 w-24 bg-slate-200 rounded mb-4" />

      <div className="flex justify-between items-start gap-6 mb-6">
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-slate-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-200 rounded" />
          </div>
        </div>

        <div className="w-12 h-12 rounded-full bg-slate-200" />
      </div>

      <div className="flex justify-between items-center mt-8">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-16 bg-slate-200 rounded" />
        </div>

        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  );
};

/* ---------------- Main Card ---------------- */
const AreaCard = ({
  title,
  label,
  goal,
  progress,
  color,
  bgColor,
  icon,
  challengeIds,
  areaId,
}: AreaCardProps) => {
  const hasChallenges = challengeIds.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ["makeover-points-summary"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/points-summary"
      );
      return res.data.data as MakeoverPointsSummary[];
    },
    retryOnMount:true
  });

  if (isLoading) {
    return <AreaCardSkeleton />;
  }

  const points = data?.find((p) => p.areaId === areaId)?.totalPoints ?? 0;
  

  const challengeLink = hasChallenges
    ? `/dashboard/challenge/my-challenges/${challengeIds.join(",")}`
    : "#";

  return (
    <div className="bg-white rounded-xl border border-slate-200 py-2 px-5 hover:border-[#1183d4]/30 transition-colors group">
      <StaticDataBadge
        label={label}
        className="w-fit relative -top-5 -left-8"
      />

      <div className="flex justify-between items-start gap-3 lg:gap-6 mb-4 min-h-[72px]">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${bgColor} ring-1 ring-white/10 mt-1`}
            style={{ color }}
          >
            <span className="w-16 h-16">{icon}</span>
          </div>

          <div className="min-h-[48px]">
            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
            <span className="block text-xs text-slate-500 font-medium leading-snug">
              Q1 Goal: {goal}
            </span>
          </div>
        </div>

        <div
          className="relative size-12 flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${color} ${progress}%, #e2e8f0 0)`,
          }}
        >
          <div className="absolute inset-1 bg-white dark:bg-[#1a2630] rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Area Points
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {points}{" "}
              <span className="text-xs font-normal text-slate-500">pts</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Buddy
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              —
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6">
          {hasChallenges ? (
            <Link
              href={`${challengeLink}?from=dashboard/complete-makeover-program/makeover-dashboard`}
              className="text-sm text-[#1183d4] font-medium hover:underline flex items-center gap-1"
            >
              View Group
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-sm text-slate-400 italic">
              No challenges yet
            </span>
          )}

          <ComingSoonWrapper>
            <button className="text-sm text-[#1183d4] font-medium hover:underline mt-2 hover:cursor-pointer">
              Find Coaches
            </button>
          </ComingSoonWrapper>
        </div>
      </div>
    </div>
  );
};

export default AreaCard;
