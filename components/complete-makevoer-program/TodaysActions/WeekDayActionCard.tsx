/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Check,
} from "lucide-react";
import { AREA_BACKGROUNDS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";
import { Commitment } from "./TodaysActionsClient";

type Props = {
  commitments: Commitment[];
  currentSlideIndex: number;

  handlePrev: () => void;
  handleNext: () => void;

  activeSlide: Commitment;

  checklist: {
    identityDone: boolean;
    actionDone: boolean;
    winLogged: boolean;
  };

  isIdentityDisabled: boolean;
  isActionDisabled: boolean;
  isWinDisabled: boolean;

  updateChecklist: (
    field: "identityDone" | "actionDone" | "winLogged",
    value: boolean
  ) => void;

  isLast: boolean;

};

export default function WeekdayActionCard({
  commitments,
  currentSlideIndex,
  handlePrev,
  handleNext,
  activeSlide,
  checklist,
  isIdentityDisabled,
  isActionDisabled,
  isWinDisabled,
  updateChecklist,
  isLast,
}: Props) {

  const totalSlides = commitments.length;
  const areaBg = AREA_BACKGROUNDS[activeSlide.areaId] ?? "bg-slate-800";


  return (
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
            <label
              className={`group flex items-start gap-3 p-3 rounded-lg border border-transparent transition-all 
                     ${isIdentityDisabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-slate-50 hover:border-slate-100"}`}
            >
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  disabled={isIdentityDisabled}
                  checked={checklist.identityDone}
                  onChange={(e) =>
                    updateChecklist("identityDone", e.target.checked)
                  }
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all disabled:opacity-90 disabled:cursor-not-allowed"
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
            <label
              className={`group flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all
      ${isActionDisabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-slate-50 hover:border-slate-100"}`}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  disabled={isActionDisabled}
                  checked={checklist.actionDone}
                  onChange={(e) =>
                    updateChecklist("actionDone", e.target.checked)
                  }
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all disabled:opacity-90 disabled:cursor-not-allowed"
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
            <label
              className={`group flex items-start gap-3 p-3 rounded-lg border border-transparent transition-all
      ${isWinDisabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-slate-50 hover:border-slate-100"}`}
            >
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={checklist.winLogged}
                  disabled={isWinDisabled}
                  onChange={(e) =>
                    updateChecklist("winLogged", e.target.checked)
                  }
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#1990e6] checked:bg-[#1990e6] transition-all disabled:opacity-90 disabled:cursor-not-allowed"
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
        disabled={isLast}
        className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all ml-6 group disabled:opacity-80 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:cursor-not-allowed"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </section>
  );
}

