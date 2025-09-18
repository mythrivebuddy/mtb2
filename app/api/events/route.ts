import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase admin client (server-only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

/**
 * GET: Fetch all events for the current user
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: events, error } = await supabaseAdmin
      .from("Event")
      .select("*")
      .eq("userId", session.user.id)
      .order("start", { ascending: true });

    if (error) throw error;

    return NextResponse.json(events, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Full error object on fetch:", error);

    const errorMessage = error.message || "An unknown error occurred";
    const errorCode = error.code || "UNKNOWN_CODE";

    return NextResponse.json(
      {
        message: "Error fetching events",
        error: errorMessage,
        details: error.details || null,
        code: errorCode,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new event
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: EventBody = await req.json();
    const { title, start, end, description, isBloom, isCompleted, allDay } =
      body;

    if (!title || !start) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const formattedStart = new Date(start).toISOString();
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

    if (error) throw error;

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Full error object on create:", error);
    const message = error.message || "Error creating event";
    return NextResponse.json(
      { success: false, message: "Error creating event", error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an existing event
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: EventBody = await req.json();
    const { id, ...updateData } = body;

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { message: "A valid Event ID is required" },
        { status: 400 }
      );
    }

    if (updateData.start) {
      updateData.start = new Date(updateData.start).toISOString();
    }

    if (updateData.end === "" || updateData.end === undefined) {
      updateData.end = null;
    } else if (updateData.end) {
      updateData.end = new Date(updateData.end).toISOString();
    }

    const { data: updatedEvent, error } = await supabaseAdmin
      .from("Event")
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("userId", session.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedEvent)
      return NextResponse.json(
        { message: "Event not found or permission denied" },
        { status: 404 }
      );

    return NextResponse.json(
      { success: true, data: updatedEvent },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Full error object on update:", error);
    const message = error.message || "Error updating event";
    return NextResponse.json(
      { success: false, message: "Error updating event", error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove an event
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: { id?: string } = await req.json();
    const { id } = body;

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { message: "A valid Event ID is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("Event")
      .delete()
      .eq("id", id)
      .eq("userId", session.user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Full error object on delete:", error);
    const message = error.message || "Error deleting event";
    return NextResponse.json(
      { success: false, message: "Error deleting event", error: message },
      { status: 500 }
    );
  }
}

