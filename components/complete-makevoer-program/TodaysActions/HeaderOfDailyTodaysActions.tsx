/* eslint-disable react/no-unescaped-entities */
"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function HeaderOfDailyTodaysActions({isTodaySunday}:{isTodaySunday:boolean}) {
  const router = useRouter();

  return (
    <header className="relative  flex flex-col sm:flex-row sm:justify-between gap-2 mb-8 animate-fade-in-up">
      <div>
        <div className="flex  items-center gap-2 text-primary font-medium mb-1">
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
        <h1 className="text-3xl text-start md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          {isTodaySunday ? `Sunday's Focus` : `Today's Focus`}
        </h1>
        <p className="text-slate-500  text-start dark:text-slate-400 mt-2 text-base">
          You have 3 core areas to conquer today. Make them count.
        </p>
      </div>
      <Button
        onClick={() =>
          router.push("/dashboard/complete-makeover-program/makeover-dashboard")
        }
        aria-label="Close"
        className="
          flex items-center justify-center
          
        "
      >
        Close this page
      </Button>
    </header>
  );
}
