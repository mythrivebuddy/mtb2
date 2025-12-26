"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Lock,
  CheckSquare,
  Users,
  Video,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import OnboardingStickyFooter from "../OnboardingStickyFooter";

interface Step6Props {
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const RULES = [
  {
    title: "Mandatory Attendance",
    description:
      "Attendance is mandatory for all weekly coaching calls (Sundays, 7 PM IST) to ensure group cohesion and maximum value extraction.",
    icon: CalendarDays,
  },
  {
    title: "Strict Confidentiality",
    description:
      "What is shared in the cohort, stays in the cohort. We maintain a safe space for vulnerability for all founders and professionals.",
    icon: Lock,
  },
  {
    title: "Weekly Assignments",
    description:
      "Assignments must be submitted 24 hours prior to the coaching call. Failure to submit for 2 consecutive weeks may result in a pause.",
    icon: CheckSquare,
  },
  {
    title: "Respectful Community",
    description:
      "Engage with empathy. We are a community of growth-oriented adults. Constructive feedback is welcome; toxicity is not.",
    icon: Users,
  },
  {
    title: "Camera On Policy",
    description:
      "During live sessions, we request all participants to keep their cameras on to foster better connection and engagement.",
    icon: Video,
  },
];

const Step6ProgramRules = ({ onBack, onConfirm, isSubmitting }: Step6Props) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen w-full font-sans text-slate-900">
      <main className="mx-auto flex w-full max-w-[1024px] flex-col gap-8 py-8 px-4 md:px-10">
        {/* Progress Bar
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <p className="text-[#0f2cbd] text-sm font-bold uppercase tracking-wide">Onboarding Progress</p>
            <p className="text-base font-medium">Step 6 of 8</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-[#0f2cbd] transition-all duration-500 ease-out" style={{ width: "75%" }}></div>
          </div>
        </div> */}

        {/* Heading */}
        <div className="flex items-center flex-col gap-4 text-center md:text-left">
          <h1 className="text-3xl text-center md:text-4xl font-black tracking-tight">
            Program Rules & Commitment
          </h1>
          <p className="text-slate-500 text-center text-lg leading-relaxed max-w-2xl">
            Transformation requires discipline. Please review the core
            guidelines for the 2026 cohort to ensure a supportive environment
            for your growth journey.
          </p>
        </div>

        {/* Rules Container */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h3 className="text-lg font-bold">Code of Conduct</h3>
            <ShieldCheck className="text-[#10b981]" size={24} />
          </div>

          <div className="p-2">
            {RULES.map((rule, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#0f2cbd]/10 text-[#10b981]">
                  <rule.icon size={24} />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <p className="text-base font-bold leading-normal">
                    {rule.title}
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Scroll hint gradient */}
          <div className="h-4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
        </div>

        {/* Commitment Section */}
        <div className="flex flex-col gap-6 pb-10">
          <label className="group flex items-start gap-4 cursor-pointer rounded-lg border border-transparent p-3 hover:bg-slate-100 transition-colors">
            <div className="relative flex items-center pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer size-6 cursor-pointer appearance-none rounded border border-slate-300 bg-white checked:bg-[#10b981] checked:border-[#10b981] focus:ring-0 transition-all"
              />
              <CheckCircle2
                className="pointer-events-none absolute left-0 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                size={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold group-hover:text-[#10b981] transition-colors">
                I have read and agree to the MTB 2026 Program Rules
              </span>
              <span className="text-xs text-slate-500 mt-1">
                By checking this box, you confirm your commitment to the program
                guidelines.
              </span>
            </div>
          </label>

          <OnboardingStickyFooter
            onBack={onBack}
            onNext={onConfirm}
            nextLabel={isSubmitting ? "Submitting..." : "I Commit"}
            disabled={!agreed || isSubmitting}
          />
        </div>
      </main>

      {/* Global CSS for Custom Scrollbar (Add to globals.css or keep in style tag) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Step6ProgramRules;
