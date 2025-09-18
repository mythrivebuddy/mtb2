// File: app/api/holidays/route.ts{kartik}

import { NextResponse } from "next/server";
import { Holiday } from "@/types/client/holiday";

const FALLBACK_HOLIDAYS: Holiday[] = [
  { date: "2025-01-26", localName: "Republic Day", name: "Republic Day" },
  { date: "2025-08-15", localName: "Independence Day", name: "Independence Day" },
  { date: "2025-10-02", localName: "Gandhi Jayanti", name: "Gandhi Jayanti" },
];

// Matches Calendarific response shape
type CalendarificHoliday = {
  date: { iso: string };
  name: string;
};

export async function GET() {
  const year = new Date().getFullYear();
  const apiKey = process.env.CALENDARIFIC_API_KEY;
  const url = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=IN&year=${year}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    console.log("Calendarific API status:", res.status);

    if (!res.ok) {
      console.error("Calendarific API error:", res.status);
      return NextResponse.json({ holidays: FALLBACK_HOLIDAYS }, { status: 200 });
    }

    const data = await res.json();

    // Map API response → our Holiday type
    const holidays: Holiday[] =
      (data?.response?.holidays as CalendarificHoliday[] | undefined)?.map((h) => ({
        date: h.date.iso,
        localName: h.name,
        name: h.name,
      })) || [];

    return NextResponse.json({ holidays }, { status: 200 });
  } catch (err) {
    console.error("Holiday fetch error:", err);
    return NextResponse.json({ holidays: FALLBACK_HOLIDAYS }, { status: 200 });
  }
}
