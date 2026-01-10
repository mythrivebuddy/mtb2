/* eslint-disable react/no-unescaped-entities */
import { Calendar } from "lucide-react";
import React from "react";

export default function HeaderOfDailyTodaysActions() {
  return (
    <header className="flex justify-center gap-2 mb-8 animate-fade-in-up">
      <div>
        <div className="flex justify-center items-center gap-2 text-primary font-medium mb-1">
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
        <h1 className="text-3xl text-center md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Today's Focus
        </h1>
        <p className="text-slate-500  text-center dark:text-slate-400 mt-2 text-base">
          You have 3 core areas to conquer today. Make them count.
        </p>
      </div>
    </header>
  );
}
