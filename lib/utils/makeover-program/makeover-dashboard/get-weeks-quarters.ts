/* =========================================================
   MTB 2026 – Program-Aware Week & Quarter Resolver
   Uses Program.startDate / endDate if present,
   otherwise falls back to MTB default dates.
   ========================================================= */

/* ---------- MTB DEFAULTS (FALLBACK) ---------- */

const MTB_DEFAULT_START = new Date("2026-01-12T00:00:00"); // Monday
const MTB_DEFAULT_END = new Date("2026-12-27T23:59:59");   // Sunday
const TOTAL_WEEKS = 51;

/* ---------- TYPES (Derived from Program model) ---------- */

export type ProgramLike = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type MTBWeekResult = {
  week: number | null;
  status: string;
};

export type MTBProgramResult = {
  totalWeeks: number;
  currentWeekNumber: number | null;
  quarterNumber: 1 | 2 | 3 | 4 | null;
  quarterLabel: "Q1" | "Q2" | "Q3" | "Q4" | null;
  status: string;
};

/* ---------- INTERNAL HELPERS ---------- */

/**
 * Resolves effective program start/end dates
 * Priority: DB → Fallback
 */
function resolveProgramDates(program?: ProgramLike) {
  return {
    startDate: program?.startDate ?? MTB_DEFAULT_START,
    endDate: program?.endDate ?? MTB_DEFAULT_END,
  };
}

/**
 * Calculates current week number from a date + program window
 */
function getMTBWeekNumber(
  date: Date,
  startDate: Date,
  endDate: Date
): MTBWeekResult {
  if (date < startDate) {
    return { week: 0, status: "Program not started" };
  }

  if (date > endDate) {
    return { week: null, status: "Program ended" };
  }

  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const diffInDays = Math.floor(
    (date.getTime() - startDate.getTime()) / MS_IN_DAY
  );

  const week = Math.floor(diffInDays / 7) + 1;

  return {
    week,
    status: `Week ${week} of ${TOTAL_WEEKS}`,
  };
}

/**
 * Resolves quarter number from week
 */
function getMTBQuarterNumberFromWeek(
  week: number
): 1 | 2 | 3 | 4 | null {
  if (week >= 1 && week <= 11) return 1;
  if (week >= 12 && week <= 24) return 2;
  if (week >= 25 && week <= 37) return 3;
  if (week >= 38 && week <= 51) return 4;
  return null;
}

/**
 * Resolves quarter label from quarter number
 */
function getMTBQuarterLabel(
  quarterNumber: 1 | 2 | 3 | 4
): "Q1" | "Q2" | "Q3" | "Q4" {
  return `Q${quarterNumber}` as "Q1" | "Q2" | "Q3" | "Q4";
}

/* ---------- PUBLIC API ---------- */

/**
 * Single function to get:
 * - totalWeeks (always 51)
 * - currentWeekNumber (0 | 1–51 | null)
 * - quarterNumber (1–4)
 * - quarterLabel (Q1–Q4)
 */
export function getMakeoverProgramWeeksAndQuarters(
  program?: ProgramLike,
  inputDate: Date | string = new Date()
): MTBProgramResult {
  const date =
    typeof inputDate === "string" ? new Date(inputDate) : inputDate;

  const { startDate, endDate } = resolveProgramDates(program);

  const weekResult = getMTBWeekNumber(date, startDate, endDate);

  const quarterNumber =
    typeof weekResult.week === "number" && weekResult.week > 0
      ? getMTBQuarterNumberFromWeek(weekResult.week)
      : null;

  const quarterLabel =
    quarterNumber !== null
      ? getMTBQuarterLabel(quarterNumber)
      : null;

  return {
    totalWeeks: TOTAL_WEEKS,
    currentWeekNumber: weekResult.week,
    quarterNumber,
    quarterLabel,
    status: weekResult.status,
  };
}
