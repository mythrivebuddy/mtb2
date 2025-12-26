"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Activity,
  Brain,
  Users,
  Briefcase,
  Wallet,
  Share2,
  Lightbulb,
  Gem,
  Flower2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import OnboardingStickyFooter from "../OnboardingStickyFooter";

interface StepTwoProps {
  selectedAreas: string[];
  areasMeta: {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  goalsByArea: Record<string, string[]>;
  onBack: () => void;
  onNext: (goals: Record<string, string>) => void;
}

const AREA_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    sub: string;
    suggestions: string[];
  }
> = {
  health: {
    icon: Activity,
    label: "Health & Fitness",
    sub: "Focus on body and mind wellness",
    suggestions: ["Lose 3kg", "Sleep 8hrs", "Gym 3x/week"],
  },
  mindset: {
    icon: Brain,
    label: "Mindset & Wellbeing",
    sub: "Emotional balance and clarity",
    suggestions: ["Daily Meditation", "Gratitude Journal", "Digital Detox"],
  },
  relationships: {
    icon: Users,
    label: "Relationships",
    sub: "Family and social connections",
    suggestions: ["Weekly Date Night", "Call Parents", "Join a Club"],
  },
  career: {
    icon: Briefcase,
    label: "Career & Business",
    sub: "Professional development",
    suggestions: ["Learn Next.js", "Get Promotion", "Update Resume"],
  },
  wealth: {
    icon: Wallet,
    label: "Wealth & Finance",
    sub: "Wealth creation & freedom",
    suggestions: ["Save $1000", "Start Investing", "Budget Daily"],
  },
  social: {
    icon: Share2,
    label: "Social Life",
    sub: "Community and influence",
    suggestions: ["Network Weekly", "Host a Dinner", "Public Speaking"],
  },
  skills: {
    icon: Lightbulb,
    label: "Skills & Learning",
    sub: "Cognitive growth",
    suggestions: ["Read 2 Books", "Learn Language", "Coding Course"],
  },
  lifestyle: {
    icon: Gem,
    label: "Lifestyle Upgrades",
    sub: "Environment & Hobbies",
    suggestions: ["Declutter Home", "Travel Monthly", "Start Painting"],
  },
  spiritual: {
    icon: Flower2,
    label: "Spiritual Growth",
    sub: "Purpose and values",
    suggestions: ["Morning Prayer", "Yoga Retreat", "Volunteer"],
  },
};

const StepTwoGoals = ({
  selectedAreas,
  onBack,
  onNext,
  areasMeta,
  goalsByArea,
}: StepTwoProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [goals, setGoals] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const labels = useMemo(
    () => selectedAreas.map((id) => AREA_CONFIG[id]?.label || id),
    [selectedAreas]
  );

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({
      left: width * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  const isLast = activeIndex === selectedAreas.length - 1;

  return (
    <main className="flex-1 flex justify-center py-8  font-display bg-[059669] min-h-screen">
      <div className="flex flex-col max-w-[1024px] w-full gap-8">
        {/* Progress */}
        <div className="flex flex-col  gap-3">
          <div className="flex items-center justify-between">
            <p className="text-text-main dark:text-emerald-100 text-sm font-semibold uppercase tracking-wider">
              Step 2 of 5
            </p>
            <p className="text-[#059669] font-bold text-sm">40%</p>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700   overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: "50%" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 text-center  mx-auto">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Define Your Quarterly Targets
          </h1>

          <p className="text-text-muted dark:text-emerald-200/70 text-lg leading-relaxed">
            You selected{" "}
            {labels.map((l, i) => (
              <span key={l}>
                <strong className="text-[#059669] dark:text-emerald-300">
                  {l}
                </strong>
                {i < labels.length - 2
                  ? ", "
                  : i === labels.length - 2
                    ? ", and "
                    : ". "}
              </span>
            ))}
            <br className="hidden md:block" />
            Set one clear goal for each area.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative w-full mx-auto mt-4">
          {/* Nav */}
          <button
            disabled={activeIndex === 0}
            onClick={() => scrollTo(activeIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 z-20 size-12 rounded-full bg-white dark:bg-card-dark border border-border-light dark:border-border-dark text-[#059669] flex items-center justify-center shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/40 disabled:opacity-30"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            disabled={isLast}
            onClick={() => scrollTo(activeIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 z-20 size-12 rounded-full bg-white dark:bg-card-dark border border-border-light dark:border-border-dark text-[#059669] flex items-center justify-center shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/40 disabled:opacity-30"
          >
            <ChevronRight size={28} />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 no-scrollbar pb-8 px-1 scroll-smooth"
          >
            {selectedAreas.map((id, idx) => {
              const cfg = areasMeta.find((a) => a.id === id)!;
              const Icon = cfg.icon;
              const suggestions = goalsByArea[id] ?? [];

              return (
                <div
                  key={id}
                  className="min-w-full snap-center flex justify-center"
                >
                  <div
                    className={`w-full rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-8 md:p-10 shadow-xl transition-all ${
                      idx === activeIndex
                        ? "opacity-100 scale-[1.01]"
                        : "opacity-40 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-emerald-100 dark:border-emerald-900/50">
                      <div className="flex items-center gap-5">
                        <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-[#059669] flex items-center justify-center">
                          <Icon size={32} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-text-main dark:text-white">
                            {cfg.title}
                          </h3>
                          <p className="text-sm text-text-muted dark:text-emerald-300/60">
                            {cfg.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-bold text-[#059669] uppercase">
                        {idx + 1} of {selectedAreas.length}
                      </div>
                    </div>

                    <label className="block text-sm font-semibold text-[#059669] mb-2">
                      What is your main goal?
                    </label>

                    <input
                      value={goals[id] || ""}
                      onChange={(e) =>
                        setGoals((p) => ({ ...p, [id]: e.target.value }))
                      }
                      placeholder="In the next 90 days, I want to..."
                      className="w-full resize-none rounded-xl border border-emerald-600  bg-emerald-50/20  p-5 text-base text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] transition-all"
                    />

                    <ScrollArea.Root className="mt-6 h-[75px] overflow-hidden">
                      <ScrollArea.Viewport className="h-full w-full">
                        <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() =>
                                setGoals((p) => ({ ...p, [id]: s }))
                              }
                              className="inline-flex items-center justify-center gap-1.5
                              rounded-full bg-white dark:bg-emerald-900/20
                              border border-emerald-100 dark:border-emerald-700
                              px-3 py-1.5 text-xs font-medium
                              text-emerald-700 dark:text-emerald-200
                              hover:bg-emerald-50 dark:hover:bg-emerald-900/40
                              whitespace-nowrap"
                            >
                              <Plus size={14} /> {s}
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
              );
            })}
          </div>

          {/* Dots */}
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

        {/* Footer */}
        <OnboardingStickyFooter
          onBack={onBack}
          onNext={() => (isLast ? onNext(goals) : scrollTo(activeIndex + 1))}
          nextLabel={isLast ? "Next Step" : "Next Area"}
        />
      </div>
    </main>
  );
};

export default StepTwoGoals;
