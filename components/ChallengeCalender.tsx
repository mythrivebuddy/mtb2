// app/components/ChallengeCalendar.tsx
"use client";

import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React from "react";

// --- TYPE DEFINITIONS ---
interface CompletionRecord {
  date: string;
  status: "COMPLETED" | "MISSED";
}

export interface ChallengeCalendarProps {
  history: CompletionRecord[];
  challengeStartDate: string;
  positionClasses: string;
  calendarRef: React.RefObject<HTMLDivElement | null>;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

// --- HELPER FUNCTIONS ---
const normalizeDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartDateAsUTC = (dateString: string): Date => {
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// --- DEBUG CALENDAR COMPONENT ---
const ChallengeCalendar = ({
  history,
  challengeStartDate,
  positionClasses,
  calendarRef,
  currentDate,
  setCurrentDate,
}: ChallengeCalendarProps) => {
  // Log all the incoming data as soon as the component renders
  console.clear(); // Clears the console for fresh logs
  console.log("=======================================");
  console.log("🕵️‍♂️ STARTING CALENDAR DEBUG 🕵️‍♂️");
  console.log("=======================================");
  console.log("PROPS RECEIVED:", { history, challengeStartDate });

  const challengeStartUTC = getStartDateAsUTC(challengeStartDate);
  console.log(`Calculated UTC Start Date: ${challengeStartUTC.toISOString()}`);

  const historyMap = new Map(
    history.map((item) => {
      const key = normalizeDate(new Date(item.date));
      const value = item.status;
      console.log(`Processing history item: Original Date='${item.date}', Creating Map Entry: ['${key}', '${value}']`);
      return [key, value];
    })
  );
  console.log("FINAL HISTORY MAP:", historyMap);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayIndex = new Date(year, month, 1).getDay();
    const grid = [];

    console.log(`--- Generating Grid for ${currentDate.toLocaleString("default", { month: "long" })} ---`);

    for (let i = 0; i < startDayIndex; i++) {
      grid.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const lookupKey = normalizeDate(date);
      const isBeforeChallenge = date < challengeStartUTC;
      const status = historyMap.get(lookupKey);

      console.log(
        `Day ${day}: lookupKey='${lookupKey}', status='${status || "N/A"}', isBeforeChallenge=${isBeforeChallenge}`
      );

      let dayContent;
      if (isBeforeChallenge) {
        dayContent = <span className="text-gray-300">{day}</span>;
      } else if (status === "COMPLETED") {
        dayContent = <CheckCircle2 className="w-6 h-6 text-green-500" />;
      } else if (status === "MISSED") {
        dayContent = <XCircle className="w-6 h-6 text-red-500" />;
      } else {
        dayContent = <span className="text-gray-500">{day}</span>;
      }

      grid.push(
        <div key={day} className={`w-10 h-10 flex items-center justify-center rounded-full ${normalizeDate(date) === normalizeDate(new Date()) ? "bg-indigo-100" : ""}`}>
          {dayContent}
        </div>
      );
    }
    return grid;
  };
  
  // No changes to the handlers or JSX return
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div ref={calendarRef as React.RefObject<HTMLDivElement>} className={`absolute ${positionClasses} w-[90vw] max-w-sm sm:w-80 bg-white p-4 rounded-lg shadow-2xl border border-gray-200 z-10`}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h3 className="font-semibold text-md text-gray-800">{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (<div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-medium text-gray-400">{day}</div>))}
        {generateCalendarGrid()}
      </div>
    </div>
  );
};

export default ChallengeCalendar;