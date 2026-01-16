"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";

type SundayTask = {
  id: string;
  label: string;
  helper?: string;
  group?: "thisWeek" | "nextWeek";
};
type SundayArea = {
  id: number;
  title: string;
  description: string;
  contextTitle: string;
  contextText: string;
  tasks: SundayTask[];
  showIdentityStatements?: boolean; // 👈 ADD
};

type Props = {
  currentSlideIndex: number;
  handlePrev: () => void;
  handleNext: () => void;
  isLast: boolean;
  identityStatements?: { title: string; text: string }[]; // ✅ ADD
};

const sundayAreas: SundayArea[] = [
  {
    id: 1,
    title: "Self Reflection",
    description: "Reflect how your week was",
    contextTitle: "This Week",
    contextText: "You showed up 5 days",
    tasks: [
      {
        id: "weekly-win",
        label: "Share Weekly Win",
        group: "thisWeek",
      },
      {
        id: "daily-win",
        label: "Log Today’s 1% Win",
        group: "thisWeek",
      },
      {
        id: "show-up",
        label: "Showing up consistently",
        group: "nextWeek",
      },
      {
        id: "better-choices",
        label: "Making better choices",
        group: "nextWeek",
      },
      {
        id: "stay-steady",
        label: "Staying steady under pressure",
        group: "nextWeek",
      },
    ],
  },
  {
    id: 2,
    title: "Identity Embodiment",
    description: "Live the identity you're building",
    contextTitle: "Identity Statements",
    contextText: "",
    showIdentityStatements: true, // 👈 ADD
    tasks: [
      {
        id: "show-up",
        label: "Showing up consistently",
      },
      {
        id: "better-choices",
        label: "Making better choices",
      },
      {
        id: "stay-steady",
        label: "Staying steady under pressure",
      },
    ],
  },

  {
    id: 3,
    title: "Accountability",
    description: "Check-in with your buddy!",
    contextTitle: "",
    contextText: "",
    tasks: [],
  },
];

export default function SundayActionCard({
  currentSlideIndex,
  handlePrev,
  handleNext,
  isLast,
  identityStatements,
}: Props) {
  const totalSlides = sundayAreas.length;
  const activeArea = sundayAreas[currentSlideIndex];
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  console.log({ identityStatements });

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };
  const thisWeekTasks = activeArea.tasks.filter((t) => t.group === "thisWeek");
  const nextWeekTasks = activeArea.tasks.filter((t) => t.group === "nextWeek");
  return (
    <section className="flex-1 flex items-center justify-center w-full mb-8">
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentSlideIndex === 0}
        className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all mr-6 group disabled:opacity-80 disabled:cursor-not-allowed"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col md:flex-row">
        {/* Left */}
        <div className="md:w-1/3 bg-slate-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1990e6] to-blue-300" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#1990e6]/5 rounded-full blur-3xl" />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-100 text-[#1990e6] p-1.5 rounded-md">
                <Heart className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-[#1990e6] uppercase tracking-widest">
                Sunday 's Reflection {currentSlideIndex + 1} of {totalSlides}
              </span>
            </div>
          </div>

          <div className="aspect-square rounded-xl mb-4 p-5 flex items-center justify-center bg-[#1990e6]">
            <h3 className="text-white text-xl font-bold text-center">
              {activeArea.title}
            </h3>
          </div>

          <p className="text-lg leading-snug line-clamp-5">
            {activeArea.description}
          </p>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">
                Weekly Reset
              </span>
              <span className="text-xs font-bold text-[#1990e6]">Sunday</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-[#1990e6] h-2 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="md:w-2/3 p-6 md:p-8 flex flex-col bg-white">
          {currentSlideIndex !== 2 && (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                {activeArea.contextTitle}
              </p>

              {currentSlideIndex === 1 &&
                identityStatements &&
                identityStatements.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {identityStatements.map((statement, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-100 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900 mb-1">
                          {statement.title}
                        </p>
                        <p className="text-sm text-slate-700 italic">
                          "{statement.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {activeArea.contextText}
              </p>
            </div>
          )}

          {/* RIGHT CONTENT BODY */}
          {currentSlideIndex === 2 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-rose-400 font-medium">Coming soon</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-3">
              {activeArea.tasks.map((task, index) => {
                const checked = checkedTasks[task.id] ?? false;

                const isFirstOfNextWeek =
                  task.group === "nextWeek" &&
                  activeArea.tasks.findIndex((t) => t.group === "nextWeek") ===
                    index;

                return (
                  <div key={task.id} className="space-y-2">
                    {isFirstOfNextWeek && (
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Next week I will live by
                      </p>
                    )}

                    <label
                      className="group flex items-start gap-3 p-3 rounded-lg border border-transparent transition-all
            cursor-pointer hover:bg-slate-50 hover:border-slate-100"
                    >
                      <div className="relative flex items-center mt-0.5">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="peer h-5 w-5 rounded border border-slate-300
                data-[state=checked]:bg-[#1990e6]
                data-[state=checked]:border-[#1990e6]"
                        />
                        <Check
                          className={`absolute pointer-events-none text-white w-3.5 h-3.5 left-[3px] top-[3px]
                transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
                          strokeWidth={3}
                        />
                      </div>

                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium transition-colors
                ${checked ? "" : "text-slate-700 group-hover:text-[#1990e6]"}`}
                        >
                          {task.label}
                        </p>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={isLast}
        className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-400 hover:text-[#1990e6] hover:bg-blue-50 shadow-md border border-slate-100 transition-all ml-6 group disabled:opacity-80 disabled:cursor-not-allowed"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </section>
  );
}
