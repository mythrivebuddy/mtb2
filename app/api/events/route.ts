// app/api/events/route.ts

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Load server env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔑 SUPABASE KEY BEING USED (starts with):", SUPABASE_SERVICE_ROLE_KEY?.substring(0, 8));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL: Supabase server environment variables are missing.");
  // This will cause the server to fail to start, which is good.
  throw new Error(
    "Supabase server environment variables missing. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  );
}

// Supabase admin client (server-only)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to check service role key. Throws the actual Supabase error.
async function validateSupabaseConnection() {
  const { error } = await supabaseAdmin.from("Event").select("id").limit(1);
  if (error) {
    console.error("❌ Supabase connection test failed:", error);
    // Throw the original, more descriptive error from Supabase
    throw error;
  }
}

// Validate UUID
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// This interface should match the database column names (snake_case)
interface EventBody {
  id?: string;
  title?: string;
  start?: string;
  end?: string | null;
  description?: string;
  is_bloom?: boolean;
  is_completed?: boolean;
  all_day?: boolean;
}

// Helper to safely extract error message
function getErrorMessage(error: unknown): string {
    // If it's a Supabase error object, provide more detail
    if (error && typeof error === 'object') {
        if ('message' in error) {
            let msg = String(error.message);
            if ('hint' in error) msg += ` (Hint: ${error.hint})`;
            return msg;
        }
    }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

/** GET: Fetch all events for the current user */
export async function GET() {
  console.log("🚀 GET /api/events :: Function called");
  try {
    await validateSupabaseConnection();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("GET /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: events, error } = await supabaseAdmin
      .from("Event")
      .select("*")
      .eq("userId", session.user.id)
      .order("start", { ascending: true });

    if (error) {
      console.error("GET /api/events :: Supabase query error:", error);
      throw error;
    }

    console.log(`GET /api/events :: Successfully fetched ${events?.length || 0} events for user ${session.user.id}.`);
    return NextResponse.json(events || [], {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ GET /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

/** POST: Create a new event */
export async function POST(req: NextRequest) {
  console.log("🚀 POST /api/events :: Function called");
  try {
    await validateSupabaseConnection();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("POST /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Expect the body to use snake_case to match DB
    const body: EventBody = await req.json();
    console.log("POST /api/events :: Request Body:", body);

    const { title, start, end, description, is_bloom, is_completed, all_day } = body;

    if (!title || !start) {
      return NextResponse.json({ message: "Missing required fields: title and start are required." }, { status: 400 });
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ message: `Invalid start date format provided: ${start}` }, { status: 400 });
    }

    const eventToInsert = {
        title,
        start: startDate.toISOString(),
        end: end ? new Date(end).toISOString() : null,
        description: description,
        is_bloom: is_bloom,
        is_completed: is_completed,
        all_day: all_day,
        userId: session.user.id,
        updatedAt: new Date().toISOString(),
    };

    const { data: newEvent, error } = await supabaseAdmin
      .from("Event")
      .insert(eventToInsert)
      .select()
      .single();

    if (error) {
      console.error("POST /api/events :: Supabase insert error:", error);
      throw error;
    }

    console.log("POST /api/events :: Successfully created event:", newEvent);
    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ POST /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

/** PATCH: Update an existing event */
export async function PATCH(req: NextRequest) {
  console.log("🚀 PATCH /api/events :: Function called");
  try {
    await validateSupabaseConnection();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: EventBody = await req.json();
    console.log("PATCH /api/events :: Request Body:", body);
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: "An Event ID is required" }, { status: 400 });
    }
    if (!uuidRegex.test(id)) {
        return NextResponse.json({ message: `Invalid Event ID format: ${id}` }, { status: 400 });
    }
    
    // Create a final object to avoid mutating the original
    const finalUpdateData = { ...updateData };

    if (finalUpdateData.start) {
        finalUpdateData.start = new Date(finalUpdateData.start).toISOString();
    }
    if (finalUpdateData.end) {
        finalUpdateData.end = new Date(finalUpdateData.end).toISOString();
    } else if (finalUpdateData.hasOwnProperty('end')) { // handles setting end to null
        finalUpdateData.end = null;
    }

    const { data: updatedEvent, error } = await supabaseAdmin
      .from("Event")
      .update({ ...finalUpdateData, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("userId", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/events :: Supabase update error:", error);
      throw error;
    }
    if (!updatedEvent) {
      return NextResponse.json({ message: "Event not found or permission denied" }, { status: 404 });
    }

    console.log("PATCH /api/events :: Successfully updated event:", updatedEvent);
    return NextResponse.json({ success: true, data: updatedEvent }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ PATCH /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

/** DELETE: Remove an event */
export async function DELETE(req: NextRequest) {
  console.log("🚀 DELETE /api/events :: Function called");
  try {
    await validateSupabaseConnection();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ message: "An Event ID is required" }, { status: 400 });
    }
    if (!uuidRegex.test(id)) {
        return NextResponse.json({ message: `Invalid Event ID format: ${id}` }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("Event")
      .delete()
      .eq("id", id)
      .eq("userId", session.user.id);

    if (error) {
      console.error("DELETE /api/events :: Supabase delete error:", error);
      throw error;
    }

    console.log(`DELETE /api/events :: Successfully deleted event with id: ${id}`);
    return NextResponse.json({ success: true, message: "Event deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ DELETE /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
