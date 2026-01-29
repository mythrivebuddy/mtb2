/* =========================================================
   2026 Complete Makeover Program Weeks & Quarters
   Uses Program.startDate / endDate if present,
   otherwise falls back to the default dates.
   ========================================================= */

/* ----------  DEFAULTS (FALLBACK) ---------- */

export const MTB_DEFAULT_START = new Date("2026-01-12T00:00:00"); // Monday
export const MTB_DEFAULT_END = new Date("2026-12-27T23:59:59");   // Sunday
export const TOTAL_WEEKS = 51;

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

/* ---------- HELPERS ---------- */


function resolveProgramDates(program?: ProgramLike) {
  return {
    startDate: program?.startDate ?? MTB_DEFAULT_START,
    endDate: program?.endDate ?? MTB_DEFAULT_END,
  };
}

/**
 * Calculates current week number from a date + program window
 */
function getMakeoverWeekNumber(
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
function getMakeoverQuarterNumberFromWeek(
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
function getMakeoverQuarterLabel(
  quarterNumber: 1 | 2 | 3 | 4
): "Q1" | "Q2" | "Q3" | "Q4" {
  return `Q${quarterNumber}` as "Q1" | "Q2" | "Q3" | "Q4";
}

/* ---------- PUBLIC function  ---------- */

/**
 *  function to get:
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

  const weekResult = getMakeoverWeekNumber(date, startDate, endDate);

  const quarterNumber =
    typeof weekResult.week === "number" && weekResult.week > 0
      ? getMakeoverQuarterNumberFromWeek(weekResult.week)
      : null;

  const quarterLabel =
    quarterNumber !== null
      ? getMakeoverQuarterLabel(quarterNumber)
      : null;

  return {
    totalWeeks: TOTAL_WEEKS,
    currentWeekNumber: weekResult.week,
    quarterNumber,
    quarterLabel,
    status: weekResult.status,
  };
}

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const QUARTER_WEEK_RANGES = {
  1: { startWeek: 1, endWeek: 11 },
  2: { startWeek: 12, endWeek: 24 },
  3: { startWeek: 25, endWeek: 37 },
  4: { startWeek: 38, endWeek: 51 },
} as const;

/* ---------- Helpers ---------- */

export function getActiveQuarterAndDaysLeft(date: Date, startDate: Date, endDate: Date) {
  if (date < startDate || date > endDate) return null;

  const diffInDays = Math.floor(
    (date.getTime() - startDate.getTime()) / MS_IN_DAY
  );

  const currentWeek = Math.floor(diffInDays / 7) + 1;

  let quarter: 1 | 2 | 3 | 4 | null = null;

  if (currentWeek <= 11) quarter = 1;
  else if (currentWeek <= 24) quarter = 2;
  else if (currentWeek <= 37) quarter = 3;
  else if (currentWeek <= 51) quarter = 4;

  if (!quarter) return null;

  const { endWeek } = QUARTER_WEEK_RANGES[quarter];

  const quarterEndDate = new Date(
    startDate.getTime() + endWeek * 7 * MS_IN_DAY - MS_IN_DAY
  );

  let daysLeft = Math.ceil(
  (quarterEndDate.getTime() - date.getTime()) / MS_IN_DAY
);

if (Object.is(daysLeft, -0)) {
  daysLeft = 0;
}


  return { quarter, daysLeft };
}
