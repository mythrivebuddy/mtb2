"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Handshake,
  Repeat,
} from "lucide-react";
import OnboardingStickyFooter from "../OnboardingStickyFooter";

interface Step6Props {
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const RULES = [
  {
    title: "Commit to Consistent Action",
    icon: Repeat,
    points: [
      "You will engage with your selected life areas through **daily micro-actions and periodic reflections**.",
      "Progress is measured by consistency, not intensity.",
      "Small steps taken regularly create extraordinary results over time.",
    ],
  },
  {
    title: "A Safe & Respectful Space",
    icon: ShieldCheck,
    points: [
      "Reflections, insights, and shared experiences inside the Makeover Program are treated with care and respect.",
      "This is a **judgment-free environment** focused on growth, honesty, and self-improvement.",
    ],
  },
  {
    title: "Progress Over Perfection",
    icon: TrendingUp,
    points: [
      `You are not expected to be perfect or "always on track".`,
      "Missed days are part of the process—returning is what matters.",
      "The goal is sustainable growth, not pressure or burnout.",
    ],
  },
  {
    title: "Responsible Participation",
    icon: Handshake,
    points: [
      "Engage with the program tools and community features thoughtfully.",
      "Encourage others through presence and positivity when interacting.",
      "The quality of your experience depends on how sincerely you participate.",
    ],
  },
];

const Step6ProgramRules = ({ onBack, onConfirm, isSubmitting }: Step6Props) => {
  const [agreed, setAgreed] = useState(false);
  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, idx) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={idx} className="font-bold text-slate-900">
          {part.replace(/\*\*/g, "")}
        </strong>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-900">
      <main className="mx-auto flex w-full max-w-[1024px] flex-col gap-8 py-8 px-4 md:px-10">
        {/* Heading */}
        <div className="flex items-center flex-col gap-4 text-center md:text-left">
          <h1 className="text-3xl text-center md:text-4xl font-black tracking-tight">
            This Is Where Your 2026 Complete Makeover Begins
          </h1>
          <p className="text-slate-500 text-center text-lg leading-relaxed max-w-2xl">
            You are stepping into a year-long, self-guided makeover designed for
            clarity, consistency, and meaningful change.
            <br />
            <br />
            This program works when you engage with intention—one small step at
            a time.
          </p>
        </div>

        {/* Rules Container */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h3 className="text-lg font-bold">Your Makeover Commitments</h3>
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
                  <ul className="mt-1 space-y-1 text-slate-700 text-sm leading-relaxed list-disc pl-5">
                    {rule.points.map((point, i) => (
                      <li key={i}>{renderBoldText(point)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          {/* Scroll hint gradient */}
          <div className="h-4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
        </div>

        {/* Commitment Section */}
        <div className="flex flex-col gap-6 pb-10">
          <label className="group flex flex-col items-start gap-2 cursor-pointer rounded-lg border border-transparent p-3 hover:bg-slate-100 transition-colors">
            <h3 className="text-lg font-bold">Final Affirmation</h3>
            <div className="flex gap-4 items-start ">
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
                  I commit to my 2026 Complete Makeover & agree to its terms and
                  conditions
                </span>
                <span className="text-xs text-slate-600 mt-1">
                  I understand that lasting change comes from consistent,
                  intentional action.
                  <br />
                  <br />
                  By continuing, I choose to take responsibility for my growth
                  and follow this journey with honesty and commitment.
                </span>
              </div>
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
