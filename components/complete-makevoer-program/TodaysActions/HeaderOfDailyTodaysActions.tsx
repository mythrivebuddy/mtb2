/* eslint-disable react/no-unescaped-entities */
import { Calendar, HistoryIcon } from "lucide-react";
import React from "react";

export default function HeaderOfDailyTodaysActions() {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-8 animate-fade-in-up">
      <div>
        <div className="flex items-center gap-2 text-primary font-medium mb-1">
          <span className="material-symbols-outlined text-xl">
            <Calendar/>
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
            <HistoryIcon/>
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
  );
}
