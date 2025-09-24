// ./app/api/test-supabase/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, message: "Supabase environment variables are missing" },
      { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Simple test query
    const { data, error } = await supabaseAdmin.from("Event").select("*");

    if (error) {
      return NextResponse.json(
        { success: false, message: "Supabase query failed", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    // Type-check 'err' to safely access the 'message' property
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}