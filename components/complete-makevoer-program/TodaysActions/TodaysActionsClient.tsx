/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AREA_BACKGROUNDS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";
import HeaderOfDailyTodaysActions from "./HeaderOfDailyTodaysActions";
import PaginationIndicatorsDailyActions from "./PaginationIndicatorsDailyActions";
import { useProgramCountdown } from "@/hooks/useProgramCountdown";
import NotStartedYetTasks from "./NotStartedYetTasks";
import OnboardingStickyFooter from "../OnboardingStickyFooter";
import { useMutation } from "@tanstack/react-query";
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

  useEffect(() => {
    if (!activeSlide) return;

    setChecklistByArea((prev) => {
      if (prev[activeSlide.areaId]) return prev;

      return {
        ...prev,
        [activeSlide.areaId]: {
          identityDone: false,
          actionDone: false,
          winLogged: false,
        },
      };
    });
  }, [activeSlide?.areaId]);

  const currentChecklist: ChecklistState = checklistByArea[
    activeSlide.areaId
  ] ?? {
    identityDone: false,
    actionDone: false,
    winLogged: false,
  };

  const updateChecklist = (field: keyof ChecklistState, value: boolean) => {
    setChecklistByArea((prev) => ({
      ...prev,
      [activeSlide.areaId]: {
        ...prev[activeSlide.areaId],
        [field]: value,
      },
    }));
  };

  // Handlers for Carousel
  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };
  const actionDoneMutation = useMutation({
    mutationFn: async () => {
      return axios.post("/api/makeover-program/makeover-daily-tasks", {
        areaIds,
        date: new Date().toISOString(),
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Daily Action completed (+${res.data.totalPointsAwarded} points)`
      );
    },
    onError: () => {
      toast.error("Failed to complete Daily Action");
    },
  });
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

  // Fallback if no data
  if (totalSlides === 0) {
    return (
      <div className="p-8 text-center">
        No commitments found for this program.
      </div>
    );
  }
  const isLast = currentSlideIndex === totalSlides - 1;

  const handleSubmitDailyActions = () => {
    // block progression unless action is done
    if (actionDoneMutation.isPending) return;
    if (!currentChecklist.actionDone) {
      toast.error("Please complete the Daily Action first");
      return;
    }

    // NOT last slide → just move forward
    if (!isLast) {
      setCurrentSlideIndex((i) => i + 1);
      return;
    }

    // LAST slide → fire API
    actionDoneMutation.mutate(undefined, {
      onSuccess: () => {
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
          className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all mr-6 group"
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
                  Card Progress
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
              <div className="relative mt-2">
                <div className="flex gap-2">
                  <div className="relative flex items-start pt-3 pl-3">
                    <input
                      type="checkbox"
                      checked={currentChecklist.winLogged}
                      onChange={(e) =>
                        updateChecklist("winLogged", e.target.checked)
                      }
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all"
                    />
                    <Check
                      className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-[14px] top-[14px]"
                      strokeWidth={3}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        className="block w-full rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm focus:border-[#1990e6] focus:ring-[#1990e6] sm:text-sm pl-3 pr-12 py-3"
                        placeholder="Log your 1% win for today..."
                        rows={1}
                      />
                      <button className="absolute right-2 top-2 bottom-2 bg-[#1990e6]/10 hover:bg-[#1990e6] hover:text-white text-[#1990e6] rounded-md px-3 text-xs font-bold transition-all uppercase tracking-wide">
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 pl-1">
                      Documenting small wins compounds over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all ml-6 group"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Pagination Indicators */}
      <PaginationIndicatorsDailyActions
        commitments={commitments}
        setCurrentSlideIndex={setCurrentSlideIndex}
        currentSlideIndex={currentSlideIndex}
      />
      <OnboardingStickyFooter
        onBack={() => {
          if (currentSlideIndex === 0) {
            router.back();
          } else {
            setCurrentSlideIndex((i) => i - 1);
          }
        }}
        onNext={handleSubmitDailyActions}
        nextLabel={isLast ? "Proceed" : "Next"}
        disabled={!currentChecklist.actionDone || actionDoneMutation.isPending}
      />
    </main>
  );
}
