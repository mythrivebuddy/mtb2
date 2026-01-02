/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Flag } from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import OnboardingStickyFooter from "../OnboardingStickyFooter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step3Props {
  selectedAreas: string[];
  // This prop receives the goals created in Step 2
  areaGoals: Record<string, string>;
  identitiesByArea: Record<string, string[]>;
  initialIdentities: Record<string, string>;
  areasMeta: {
    id: string;
    title: string;
    description?: string;
    icon: React.ElementType;
  }[];
  onBack: () => void;
  onNext: (identities: Record<string, string>) => void;
}

const Step3IdentitySelection = ({
  selectedAreas = [],
  areaGoals = {},
  identitiesByArea = {},
  initialIdentities,
  areasMeta = [],
  onBack,
  onNext,
}: Step3Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [identities, setIdentities] = useState<Record<string, string>>({});
  useEffect(() => {
    setIdentities(initialIdentities);
  }, [initialIdentities]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to get titles for the header summary
  // const labels = useMemo(() => {
  //   return selectedAreas.map((id) => {
  //     const area = areasMeta.find((a) => a.id === id);
  //     return area?.title ?? id;
  //   });
  // }, [selectedAreas, areasMeta]);

  // 1. Detect manual swiping on mobile
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const newIndex = Math.round(scrollLeft / clientWidth);

      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < selectedAreas.length
      ) {
        setActiveIndex(newIndex);
      }
    }
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({
      left: width * index,
      behavior: "smooth",
    });
  };

  const isLast = activeIndex === selectedAreas.length - 1;

  return (
    <div className="min-h-screen font-['Inter'] text-[#0d101b]">
      <main className="mx-auto px-4 lg:px-10 py-6">
        <div className="grid grid-cols-1 sm:max-w-[1024px] gap-4 sm:px-6 lg:px-0 mx-auto">
          {/* Progress Bar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-text-main dark:text-emerald-100 text-sm font-semibold uppercase tracking-wider">
                Step 3 of 5
              </p>
              <p className="text-[#059669] font-bold text-sm">60%</p>
            </div>

            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: "60%" }}
              />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-4 sm:gap-2 text-center mx-auto">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
              Define Your 2026 Identity
            </h1>

            <p className="text-text-muted dark:text-emerald-200/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Goals are what you want to achieve. Identity is who you become.
              <br className="hidden md:block" />
              Who do you need to be to reach your goals?
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative mx-auto mt-1 w-full">
            {/* Desktop Navigation Buttons */}
            <button
              disabled={activeIndex === 0}
              onClick={() => scrollTo(activeIndex - 1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-20 size-12
            rounded-full bg-white dark:bg-card-dark
            border border-border-light dark:border-border-dark
            text-[#059669]
            hidden lg:flex items-center justify-center
            shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/40
            disabled:opacity-30"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              disabled={isLast}
              onClick={() => scrollTo(activeIndex + 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-20 size-12
            rounded-full bg-white dark:bg-card-dark
            border border-border-light dark:border-border-dark
            text-[#059669]
            hidden lg:flex items-center justify-center
            shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/40
            disabled:opacity-30"
            >
              <ChevronRight size={28} />
            </button>

            {/* Scrollable Area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6
            no-scrollbar pb-6 sm:pb-8 px-1 scroll-smooth w-full"
            >
              {selectedAreas.map((id, idx) => {
                const cfg = areasMeta.find((a) => a.id === id)!;
                const Icon = cfg.icon;
                const suggestions = identitiesByArea[id] ?? [];

                // Retrieve the specific goal set in Step 2 for this area
                const currentGoal = areaGoals[id] || "No goal set";

                return (
                  <div
                    key={id}
                    className="min-w-full snap-center flex justify-center"
                  >
                    <div
                      className={`w-full rounded-2xl bg-card-light dark:bg-card-dark
                    border border-border-light dark:border-border-dark
                    p-6 sm:p-8 md:p-10
                    shadow-xl transition-all duration-300 ${
                      idx === activeIndex
                        ? "opacity-100 scale-[1.01]"
                        : "opacity-40 scale-95 pointer-events-none"
                    }`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 pb-6 border-b border-emerald-100 dark:border-emerald-900/50">
                        <div className="flex items-center gap-5">
                          <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-[#059669] flex items-center justify-center">
                            <Icon size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white">
                              {cfg.title}
                            </h3>
                            <p className="text-sm text-text-muted dark:text-emerald-300/60">
                              Identity Selection
                            </p>
                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-bold text-[#059669] uppercase w-fit">
                          {idx + 1}/{selectedAreas.length}
                        </div>
                      </div>

                      {/* --- DISPLAY STEP 2 GOAL HERE --- */}
                      <div className="mt-6 mb-4 rounded-xl border border-emerald-200/60 bg-[#f0fdf4] dark:bg-emerald-900/20 p-4 flex gap-4 items-start">
                        <div className="rounded-lg bg-white dark:bg-emerald-800 p-2 shadow-sm text-[#059669] shrink-0">
                          <Flag size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#059669] mb-1">
                            Your Goal for Q1
                          </p>
                          <p className="text-base font-medium text-[#0d101b] dark:text-white italic leading-snug">
                            "{currentGoal}"
                          </p>
                        </div>
                      </div>
                      {/* -------------------------------- */}

                      {/* Input Label */}
                      <label className="block text-sm font-semibold text-[#059669] mb-2 mt-6">
                        Complete this statement:
                      </label>

                      {/* Text Input */}
                      <input
                        value={identities[id] || ""}
                        onChange={(e) =>
                          setIdentities((p) => ({ ...p, [id]: e.target.value }))
                        }
                        placeholder="I am a person who..."
                        className="w-full resize-none rounded-xl border border-emerald-600
                      bg-emerald-50/20 p-4 sm:p-5
                      text-base text-slate-900 dark:text-white
                      placeholder:text-slate-500
                      focus:border-[#059669] focus:ring-2 focus:ring-[#059669]
                      transition-all"
                      />

                      {/* Suggestions / Options */}

                      {/* Mobile: Dropdown */}
                      <div className="mt-6 sm:hidden">
                        <Select
                          onValueChange={(value) =>
                            setIdentities((p) => ({ ...p, [id]: value }))
                          }
                        >
                          <SelectTrigger className="w-full bg-inherit border border-emerald-600 rounded-lg">
                            <SelectValue placeholder="Choose an identity" />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Desktop: Scrollable List */}
                      <div className="hidden sm:block">
                        <ScrollArea.Root className="mt-6 h-[180px] overflow-hidden">
                          <ScrollArea.Viewport className="h-full w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pr-3">
                              {suggestions.map((s) => (
                                <button
                                  key={s}
                                  onClick={() =>
                                    setIdentities((p) => ({ ...p, [id]: s }))
                                  }
                                  className={`inline-flex items-center justify-start gap-3
                                  rounded-xl border px-4 py-3 text-xs font-medium text-left
                                  transition-all duration-200
                                  ${"bg-white dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"}
                                  `}
                                >
                                  <span className="shrink-0">
                                    <Plus size={16} />
                                  </span>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </ScrollArea.Viewport>

                          <ScrollArea.Scrollbar
                            orientation="vertical"
                            className="flex touch-none select-none p-0.5"
                          >
                            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-emerald-400/60" />
                          </ScrollArea.Scrollbar>
                        </ScrollArea.Root>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-3 mt-4">
              {selectedAreas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIndex
                      ? "w-8 bg-[#059669]"
                      : "w-2 bg-emerald-200 dark:bg-emerald-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Sticky Footer */}
          <OnboardingStickyFooter
            onBack={onBack}
            onNext={() =>
              isLast ? onNext(identities) : scrollTo(activeIndex + 1)
            }
            nextLabel={isLast ? "Next Step" : "Next Area"}
          />
        </div>
      </main>
    </div>
  );
};

export default Step3IdentitySelection;
