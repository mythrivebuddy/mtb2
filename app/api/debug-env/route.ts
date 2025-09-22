import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXT_URL: process.env.NEXT_URL || "undefined",
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || "undefined",
    SUPABASE_URL: process.env.SUPABASE_URL || "undefined",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined",
    NODE_ENV: process.env.NODE_ENV,
  });
}
