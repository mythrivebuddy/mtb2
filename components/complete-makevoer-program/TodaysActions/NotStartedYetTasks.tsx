"use client";

import React from "react";
import { Hourglass, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------------- Types ---------------- */
type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type ProgramLockedViewProps = {
  timeLeft: TimeLeft;
  startDate?: Date | null;
  title?: string;
  description?: React.ReactNode;
  onBack?: () => void;
};

/* ---------------- Sub Component ---------------- */
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

/* ---------------- Main Component ---------------- */
export default function NotStartedYetTasks({
  timeLeft,
  startDate,
  title = "Program Locked",
  description = (
    <>
      Your transformation journey is being prepared.
      <br />
      Get ready to start.
    </>
  ),
  onBack,
}: ProgramLockedViewProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col  items-center justify-center min-h-[60vh]">
      <div className="w-full  bg-white shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
        {/* Icon */}
        <div className="bg-[#1990e6]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Hourglass className="text-[#1990e6] w-9 h-9" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>

        {/* Description */}
        <p className="text-slate-500 mb-8">{description}</p>

        {/* Countdown */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
            Starts In
          </p>

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

        {/* Back Button
        <Button onClick={onBack ?? (() => router.back())} className="w-full">
          Go Back <ArrowRight className="ml-2 w-4 h-4" />
        </Button> */}
      </div>
    </div>
  );
}
