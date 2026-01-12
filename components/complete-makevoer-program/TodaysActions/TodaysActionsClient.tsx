/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Check,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AREA_BACKGROUNDS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";
import HeaderOfDailyTodaysActions from "./HeaderOfDailyTodaysActions";
import PaginationIndicatorsDailyActions from "./PaginationIndicatorsDailyActions";
import { useProgramCountdown } from "@/hooks/useProgramCountdown";
import NotStartedYetTasks from "./NotStartedYetTasks";
import OnboardingStickyFooter from "../OnboardingStickyFooter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

/* ---------------- Types ---------------- */
export type Commitment = {
  id: string;
  areaId: number;
  areaName: string; // Added
  areaDescription: string; // Added
  goalText: string;
  identityText: string;
  actionText: string;
  isLocked: boolean;
};
type ChecklistState = {
  identityDone: boolean;
  actionDone: boolean;
  winLogged: boolean;
};

/* ---------------- Main Component ---------------- */
export default function TodaysActionsClient({
  startDate,
  commitments,
}: {
  startDate: Date | null;
  commitments: Commitment[];
}) {
  // State 1: Current Slide Index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mounted, timeLeft, isProgramStarted } =
    useProgramCountdown(startDate);

  const [checklistByArea, setChecklistByArea] = useState<
    Record<number, ChecklistState>
  >({});

  // Derived state for Carousel
  const totalSlides = commitments.length;
  const activeSlide = commitments[currentSlideIndex];
  const areaBg = AREA_BACKGROUNDS[activeSlide.areaId] ?? "bg-slate-800";
  const areaIds = React.useMemo(
    () => commitments.map((c) => c.areaId),
    [commitments]
  );
  const lockQuery = useQuery({
    queryKey: ["today-lock-status"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-daily-tasks/today-lock"
      );
      return res.data as {
        isDayLocked: boolean;
        unlockAt?: string;
      };
    },

    // 🔒 DO NOT refetch during the day
    // staleTime: Infinity,
    // cacheTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  console.log(lockQuery.data);
  const todayProgressQuery = useQuery({
    queryKey: ["today-progress"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-daily-tasks/today-progress"
      );
      return res.data.data as {
        areaId: number;
        identityDone: boolean;
        actionDone: boolean;
        winLogged: boolean;
      }[];
    },
    enabled: isProgramStarted,
  });

  useEffect(() => {
    if (!todayProgressQuery.data) return;

    const mapped: Record<number, ChecklistState> = {};

    todayProgressQuery.data.forEach((log) => {
      mapped[log.areaId] = {
        identityDone: log.identityDone,
        actionDone: log.actionDone,
        winLogged: log.winLogged,
      };
    });

    setChecklistByArea((prev) => ({
      ...prev,
      ...mapped,
    }));
  }, [todayProgressQuery.data]);

  const unlockDate = React.useMemo(() => {
    if (!lockQuery.data?.unlockAt) return null;

    const now = new Date();

    // next LOCAL midnight
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
  }, [lockQuery.data?.unlockAt]);

  const { timeLeft: dayUnlockTimeLeft, isProgramStarted: isDayUnlocked } =
    useProgramCountdown(unlockDate);
  useEffect(() => {
    if (!lockQuery.data?.unlockAt) return;

    const unlockTime = new Date(lockQuery.data.unlockAt).getTime();
    const now = Date.now();
    const delay = unlockTime - now;

    if (delay <= 0) return;

    const timer = setTimeout(() => {
      lockQuery.refetch();
    }, delay);

    return () => clearTimeout(timer);
  }, [lockQuery.data?.unlockAt]);

  useEffect(() => {
    if (!todayProgressQuery.data || commitments.length === 0) return;

    // map areaId → checklist
    const progressMap = new Map(
      todayProgressQuery.data.map((log) => [
        log.areaId,
        log.identityDone && log.actionDone && log.winLogged,
      ])
    );

    // find first incomplete area in commitments order
    const firstIncompleteIndex = commitments.findIndex((c) => {
      return progressMap.get(c.areaId) !== true;
    });

    if (firstIncompleteIndex !== -1) {
      setCurrentSlideIndex(firstIncompleteIndex);
    }
  }, [todayProgressQuery.data, commitments]);

  const currentChecklist: ChecklistState = {
    identityDone: checklistByArea[activeSlide.areaId]?.identityDone ?? false,
    actionDone: checklistByArea[activeSlide.areaId]?.actionDone ?? false,
    winLogged: checklistByArea[activeSlide.areaId]?.winLogged ?? false,
  };

  const updateChecklist = (field: keyof ChecklistState, value: boolean) => {
    const areaId = activeSlide.areaId;

    // optimistic UI
    setChecklistByArea((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [field]: value,
      },
    }));

    checkboxMutation.mutate({
      areaId,
      field,
      value,
    });
  };

  // Handlers for Carousel
  const handleNext = () => {
    if (!isAreaCompleted) {
      toast.error("Complete all tasks in this area before moving forward");
      return;
    }
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };
  const areaCompletionMutation = useMutation({
    mutationFn: async (areaId: number) => {
      return axios.post("/api/makeover-program/makeover-daily-tasks", {
        areaId,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("+75 points added 🎉");
    },
    onError: () => {
      toast.error("Failed to complete area");
    },
  });

  const checkboxMutation = useMutation({
    mutationFn: async ({
      areaId,
      field,
      value,
    }: {
      areaId: number;
      field: "identityDone" | "actionDone" | "winLogged";
      value: boolean;
    }) => {
      return axios.post(
        "/api/makeover-program/makeover-daily-tasks/checkboxes",
        {
          areaId,
          field,
          value,
          date: new Date().toISOString(),
        }
      );
    },
  });
  const isDayLocked = lockQuery.data?.isDayLocked;

  const isAreaCompleted =
    currentChecklist.identityDone &&
    currentChecklist.actionDone &&
    currentChecklist.winLogged;

  const isCheckboxDisabled = isDayLocked || isAreaCompleted;

  // Prevent hydration mismatch
  if (!mounted) return null;

  // VIEW 1: Waiting Room (Timer)
  if (!isProgramStarted) {
    return (
      <main className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <NotStartedYetTasks
          timeLeft={timeLeft}
          isBack={true}
          startDate={startDate}
          title="Program Locked"
          description={
            <>
              Your transformation journey is being prepared.
              <br />
              Get ready to start.
            </>
          }
        />
      </main>
    );
  }
  if (lockQuery.isLoading) {
    return (
      <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }
  // 🔒 Day locked → show countdown till midnight
  if (
    isProgramStarted &&
    lockQuery.data?.isDayLocked &&
    unlockDate &&
    !isDayUnlocked
  ) {
    return (
      <main className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <NotStartedYetTasks
          timeLeft={dayUnlockTimeLeft}
          startDate={unlockDate}
          isBack={true}
          title="All Tasks Completed 🎉"
          description={
            <>
              You’ve completed all your tasks for today.
              <br />
              Come back tomorrow to continue.
            </>
          }
        />
      </main>
    );
  }

  // Fallback if no data
  if (totalSlides === 0) {
    return (
      <div className="p-8 text-center">
        No commitments found for this program.
      </div>
    );
  }
  const isLast = currentSlideIndex === totalSlides - 1;
  const completedActionWins = commitments
    .filter((c) => checklistByArea[c.areaId]?.actionDone)
    .slice(0, 3)
    .map((c) => c.actionText);

  const handleSubmitDailyActions = () => {
    if (areaCompletionMutation.isPending) return;

    // const checklist = checklistByArea[activeSlide.areaId];

    if (!isAreaCompleted) {
      toast.error("Complete all tasks in this area to continue");
      return;
    }

    // fire AREA completion
    areaCompletionMutation.mutate(activeSlide.areaId, {
      onSuccess: () => {
        if (!isLast) {
          setCurrentSlideIndex((i) => i + 1);
          return;
        }

        // 🔥 fire-and-forget (intentionally not awaited)
        axios
          .post("/api/makeover-program/makeover-daily-tasks/log-win", {
            areaIds,
            contents: completedActionWins,
            date: new Date().toISOString(),
          })
          .catch((err) => {
            // optional logging only
            console.error("Log win failed", err);
          });
        queryClient.invalidateQueries({
          queryKey: ["makeover-points-summary"],
        });
        // 🚀 immediately move user forward
        router.push("/dashboard/complete-makeover-program/makeover-dashboard");
      },
    });
  };

  // VIEW 2: Main Carousel Page
  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <HeaderOfDailyTodaysActions />
      {/* Main Carousel Area */}
      <section className="flex-1 flex items-center justify-center w-full mb-8">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all mr-6 group disabled:opacity-80 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Active Card Container */}
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          {/* Left Side: Visual & High Level Context */}
          <div className="md:w-1/3 bg-slate-50 p-6 flex flex-col max-sm:gap-4 justify-between border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
            {/* Decorative Background element */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1990e6] to-blue-300"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#1990e6]/5 rounded-full blur-3xl"></div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-[#1990e6] p-1.5 rounded-md">
                  <Heart className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-[#1990e6] uppercase tracking-widest">
                  Area {currentSlideIndex + 1} of {totalSlides}
                </span>
              </div>

              {/* <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                {activeSlide.areaName || "Focus Area"}
              </h2>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                {activeSlide.areaDescription}
              </p> */}
            </div>

            <div
              className="aspect-square rounded-xl mb-4 p-5 flex flex-col justify-center items-center"
              style={{ backgroundColor: areaBg }}
            >
              <div className="text-center">
                <h3 className="text-white text-xl font-bold leading-tight mb-1">
                  {activeSlide.areaName}
                </h3>
              </div>
            </div>
            <p className="text-lg leading-snug line-clamp-5">
              {activeSlide.areaDescription}
            </p>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">
                  Area Progress
                </span>
                <span className="text-xs font-bold text-[#1990e6]">0%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-[#1990e6] h-2 rounded-full w-0 transition-all duration-500"></div>
              </div>
            </div>
          </div>

          {/* Right Side: Actionable Content */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col h-full bg-white">
            {/* Read-Only Context Block */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="mb-3 pb-3 border-b border-slate-200/50">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Quarterly Goal
                </p>
                <p className="text-slate-800 font-medium text-sm leading-relaxed">
                  {activeSlide.goalText}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Identity Statement
                </p>
                <p className="text-slate-800 font-medium text-sm leading-relaxed italic">
                  "{activeSlide.identityText}"
                </p>
              </div>
            </div>

            {/* Daily Action Block */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 bg-[#1990e6]/10 rounded-full p-3 flex items-center justify-center text-[#1990e6]">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Today's Action
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {activeSlide.actionText}
                </p>
              </div>
            </div>

            {/* Checklist Actions */}
            <div className="flex-1 flex flex-col justify-end space-y-3">
              {/* Item 1 */}
              <label className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    disabled={isCheckboxDisabled}
                    checked={currentChecklist.identityDone}
                    onChange={(e) =>
                      updateChecklist("identityDone", e.target.checked)
                    }
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all"
                  />
                  <Check
                    className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-0.5 top-0.5"
                    strokeWidth={3}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#1990e6] transition-colors">
                    Complete Identity Practice
                  </p>
                </div>
              </label>

              {/* Item 2 */}
              <label className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    disabled={isCheckboxDisabled}
                    checked={currentChecklist.actionDone}
                    onChange={(e) =>
                      updateChecklist("actionDone", e.target.checked)
                    }
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all"
                  />
                  <Check
                    className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-0.5 top-0.5"
                    strokeWidth={3}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#1990e6] transition-colors">
                    Mark Daily Action Done
                  </p>
                </div>
              </label>

              {/* Item 3: Log Win */}
              <label className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={currentChecklist.winLogged}
                    disabled={isCheckboxDisabled}
                    onChange={(e) =>
                      updateChecklist("winLogged", e.target.checked)
                    }
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all"
                  />
                  <Check
                    className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-0.5 top-0.5"
                    strokeWidth={3}
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#1990e6] transition-colors">
                    Log today’s 1% win
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Documenting small wins compounds over time.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all ml-6 group disabled:opacity-80 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          aria-label="Next Slide"
          disabled={!isAreaCompleted}
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Pagination Indicators */}
      <PaginationIndicatorsDailyActions
        commitments={commitments}
        setCurrentSlideIndex={setCurrentSlideIndex}
        currentSlideIndex={currentSlideIndex}
        disabled={!isAreaCompleted}
      />
      <OnboardingStickyFooter
        onBack={() => {
          if (currentSlideIndex !== 0) {
            setCurrentSlideIndex((i) => i - 1);
          }
        }}
        onNext={handleSubmitDailyActions}
        nextLabel={isLast ? "Proceed" : "Next"}
        backDisabled={currentSlideIndex === 0}
        disabled={!isAreaCompleted || areaCompletionMutation.isPending}
      />
    </main>
  );
}
