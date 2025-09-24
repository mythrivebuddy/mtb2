import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Load server env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL: Supabase server environment variables are missing.");
  throw new Error(
    "Supabase server environment variables missing. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  );
}

// Supabase admin client (server-only)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to check service role key
async function testSupabaseKey() {
  const { data, error } = await supabaseAdmin.from("Event").select("*").limit(1);
  if (error) {
    console.error("❌ Supabase test query failed:", error.message);
    throw new Error("Supabase service key invalid or table 'Event' missing.");
  }
  return data;
}

// Validate UUID
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface EventBody {
  id?: string;
  title?: string;
  start?: string;
  end?: string | null;
  description?: string;
  isBloom?: boolean;
  isCompleted?: boolean;
  allDay?: boolean;
}

// Helper to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

/** GET: Fetch all events for the current user */
export async function GET() {
  console.log("🚀 GET /api/events :: Function called");
  try {
    await testSupabaseKey();

    const session = await getServerSession(authOptions);
    console.log("GET /api/events :: Session:", session);

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
    console.error("❌ GET /api/events :: Caught an exception:", getErrorMessage(error));
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

/** POST: Create a new event */
export async function POST(req: NextRequest) {
  console.log("🚀 POST /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    console.log("POST /api/events :: Session:", session);

    if (!session?.user?.id) {
      console.warn("POST /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: EventBody = await req.json();
    console.log("POST /api/events :: Request Body:", body);

    const { title, start, end, description, isBloom, isCompleted, allDay } = body;

    if (!title || !start) {
      console.warn("POST /api/events :: Missing required fields 'title' or 'start'.");
      return NextResponse.json({ message: "Missing required fields: title and start are required." }, { status: 400 });
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      console.error("POST /api/events :: Invalid 'start' date received:", start);
      return NextResponse.json({ message: `Invalid start date format provided: ${start}` }, { status: 400 });
    }

    const formattedStart = startDate.toISOString();
    const formattedEnd = end ? new Date(end).toISOString() : null;

    const { data: newEvent, error } = await supabaseAdmin
      .from("Event")
      .insert({
        title,
        start: formattedStart,
        end: formattedEnd,
        description,
        isBloom,
        isCompleted,
        allDay,
        userId: session.user.id,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/events :: Supabase insert error:", error);
      throw error;
    }

    console.log("POST /api/events :: Successfully created event:", newEvent);
    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ POST /api/events :: Caught an exception:", getErrorMessage(error));
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

/** PATCH: Update an existing event */
export async function PATCH(req: NextRequest) {
  console.log("🚀 PATCH /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    console.log("PATCH /api/events :: Session:", session);

    if (!session?.user?.id) {
      console.warn("PATCH /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: EventBody = await req.json();
    console.log("PATCH /api/events :: Request Body:", body);
    
    const { id, ...updateData } = body;

    if (!id || !uuidRegex.test(id)) {
      console.warn("PATCH /api/events :: Invalid or missing Event ID.");
      return NextResponse.json({ message: "A valid Event ID is required" }, { status: 400 });
    }
    
    // --- START: Robust Date Validation for PATCH ---
    const finalUpdateData: Partial<EventBody> = { ...updateData };

    if (finalUpdateData.start) {
        const startDate = new Date(finalUpdateData.start);
        if (isNaN(startDate.getTime())) {
            console.error("PATCH /api/events :: Invalid 'start' date received for update:", finalUpdateData.start);
            return NextResponse.json({ message: `Invalid start date format provided: ${finalUpdateData.start}` }, { status: 400 });
        }
        finalUpdateData.start = startDate.toISOString();
    }

    if (finalUpdateData.end) {
        const endDate = new Date(finalUpdateData.end);
        if (isNaN(endDate.getTime())) {
            console.error("PATCH /api/events :: Invalid 'end' date received for update:", finalUpdateData.end);
            return NextResponse.json({ message: `Invalid end date format provided: ${finalUpdateData.end}` }, { status: 400 });
        }
        finalUpdateData.end = endDate.toISOString();
    } else if (finalUpdateData.end === '' || finalUpdateData.end === null || finalUpdateData.end === undefined) {
        finalUpdateData.end = null;
    }
    // --- END: Robust Date Validation for PATCH ---
    
    console.log("PATCH /api/events :: Processed update data:", finalUpdateData);

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
      console.warn(`PATCH /api/events :: Event with ID ${id} not found for user ${session.user.id}.`);
      return NextResponse.json({ message: "Event not found or permission denied" }, { status: 404 });
    }
    
    console.log("PATCH /api/events :: Successfully updated event:", updatedEvent);
    return NextResponse.json({ success: true, data: updatedEvent }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ PATCH /api/events :: Caught an exception:", getErrorMessage(error));
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

/** DELETE: Remove an event */
export async function DELETE(req: NextRequest) {
  console.log("🚀 DELETE /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    console.log("DELETE /api/events :: Session:", session);

    if (!session?.user?.id) {
      console.warn("DELETE /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: { id?: string } = await req.json();
    console.log("DELETE /api/events :: Request Body:", body);
    const { id } = body;

    if (!id || !uuidRegex.test(id)) {
      console.warn("DELETE /api/events :: Invalid or missing Event ID.");
      return NextResponse.json({ message: "A valid Event ID is required" }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("Event")
      .delete()
      .eq("id", id)
      .eq("userId", session.user.id);

    if (deleteError) {
      console.error("DELETE /api/events :: Supabase delete error:", deleteError);
      throw deleteError;
    }
    
    console.log(`DELETE /api/events :: Successfully deleted event with id: ${id}`);
    return NextResponse.json({ success: true, message: "Event deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ DELETE /api/events :: Caught an exception:", getErrorMessage(error));
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}