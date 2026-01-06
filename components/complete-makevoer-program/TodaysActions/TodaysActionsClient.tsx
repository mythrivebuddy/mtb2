/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect } from "react";
import {
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Check,
  ArrowRight,
  Calendar,
  HistoryIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AREA_BACKGROUNDS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";

/* ---------------- Types ---------------- */
type Commitment = {
  id: string;
  areaId: number;
  areaName: string; // Added
  areaDescription: string; // Added
  goalText: string;
  identityText: string;
  actionText: string;
  isLocked: boolean;
};

/* ---------------- Helpers ---------------- */
function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 min-w-[80px]">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function getRemainingTime(targetDate: Date | null) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const now = new Date();
  const diff = Math.max(targetDate.getTime() - now.getTime(), 0);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

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

  // State 2: Countdown Logic
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(startDate));
  const [isProgramStarted, setIsProgramStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize Timer
  useEffect(() => {
    setMounted(true);

    // Initial check
    const now = new Date();
    const target = startDate ? new Date(startDate) : null;
    const isStarted = target ? target <= now : false;

    setIsProgramStarted(isStarted);

    if (!isStarted && target) {
      const timer = setInterval(() => {
        const remaining = getRemainingTime(target);
        setTimeLeft(remaining);

        // Timer finish check
        if (
          remaining.days <= 0 &&
          remaining.hours <= 0 &&
          remaining.minutes <= 0 &&
          remaining.seconds <= 0
        ) {
          setIsProgramStarted(true);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startDate]);

  // Derived state for Carousel
  const totalSlides = commitments.length;
  const activeSlide = commitments[currentSlideIndex] || commitments[0];
  const areaBg = AREA_BACKGROUNDS[activeSlide.areaId] ?? "bg-slate-800";


  // Handlers for Carousel
  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  // VIEW 1: Waiting Room (Timer)
  if (!isProgramStarted) {
    return (
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
          <div className="bg-[#1990e6]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hourglass className="text-[#1990e6] w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Program Locked
          </h1>
          <p className="text-slate-500 mb-8">
            Your transformation journey is being prepared. <br />
            Get ready to start.
          </p>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
              Starts In
            </p>

            {/* Interactive TimeBoxes */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <TimeBox label="Days" value={timeLeft.days} />
              <TimeBox label="Hours" value={timeLeft.hours} />
              <TimeBox label="Mins" value={timeLeft.minutes} />
              <TimeBox label="Secs" value={timeLeft.seconds} />
            </div>

            {startDate && (
              <p className="text-sm text-[#1990e6] font-medium mt-6">
                {new Date(startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          <Button onClick={() => router.back()} className="w-full">
            Go Back <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
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

  // VIEW 2: Main Carousel Page
  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-8 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium mb-1">
            <span className="material-symbols-outlined text-xl">
              <Calendar />
            </span>
            <span className="text-sm uppercase tracking-wide">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Today's Focus
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            You have 3 core areas to conquer today. Make them count.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              <HistoryIcon />
            </span>
            History
          </button>
          <button className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-[18px]">
              <Calendar />
            </span>
            Calendar
          </button>
        </div>
      </header>
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
          <div className="md:w-1/3 bg-slate-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
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
              className="w-full h-full rounded-xl mb-4 p-5 flex flex-col justify-center items-center"
              style={{ backgroundColor: areaBg }}
            >
              <div className="text-start">
                <h3 className="text-white text-lg font-bold leading-tight mb-1">
                  {activeSlide.areaName}
                </h3>
                <p className="text-white/80 text-xs leading-snug line-clamp-3">
                  {activeSlide.areaDescription}
                </p>
              </div>
            </div>

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
      <div className="flex items-center justify-center gap-3 mb-8">
        {commitments.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlideIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === currentSlideIndex
                ? "w-8 bg-[#1990e6]"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
