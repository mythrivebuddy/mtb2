// app/api/events/route.ts

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Make sure you have a prisma client instance configured at this path
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// This interface defines the expected shape of the request body.
// It uses camelCase, which aligns with Prisma's conventions.
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

// Helper to safely extract error message from various error types
function getErrorMessage(error: unknown): string {
  // If it's a known object with a message property
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

/** GET: Fetch all events for the current user */
export async function GET() {
  console.log("🚀 GET /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("GET /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        start: "asc",
      },
    });

    console.log(
      `GET /api/events :: Successfully fetched ${events.length} events for user ${session.user.id}.`,
    );
    return NextResponse.json(events, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ GET /api/events :: Caught an exception:", errorMessage);

    // Temporarily return the detailed error message for debugging
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events.",
        // Add a 'debugError' field to the response
        debugError: errorMessage,
      },
      { status: 500 },
    );
  }
}

/** POST: Create a new event */
export async function POST(req: NextRequest) {
  console.log("🚀 POST /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("POST /api/events :: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: EventBody = await req.json();
    console.log("POST /api/events :: Request Body:", body);

    const { title, start, end, description, isBloom, isCompleted, allDay } =
      body;

    if (!title || !start) {
      return NextResponse.json(
        { message: "Missing required fields: title and start are required." },
        { status: 400 },
      );
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { message: `Invalid start date format provided: ${start}` },
        { status: 400 },
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        start: startDate,
        end: end ? new Date(end) : null,
        description,
        is_bloom: isBloom,
        is_completed: isCompleted,
        all_day: allDay,
        userId: session.user.id,
      },
    });

    console.log("POST /api/events :: Successfully created event:", newEvent);
    return NextResponse.json(
      { success: true, data: newEvent },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ POST /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json(
      { success: false, message: "Failed to create event." },
      { status: 500 },
    );
  }
}

/** PATCH: Update an existing event */
export async function PATCH(req: NextRequest) {
  console.log("🚀 PATCH /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: EventBody = await req.json();
    console.log("PATCH /api/events :: Request Body:", body);
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { message: "An Event ID is required" },
        { status: 400 },
      );
    } // Prepare data for Prisma, converting date strings to Date objects
    const dataToUpdate: Prisma.EventUpdateManyMutationInput = {};

    //  Map camelCase → snake_case
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;

    if (updateData.start) {
      dataToUpdate.start = new Date(updateData.start);
    }

    if ("end" in updateData) {
      dataToUpdate.end = updateData.end ? new Date(updateData.end) : null;
    }

    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description;

    if (updateData.isBloom !== undefined)
      dataToUpdate.is_bloom = updateData.isBloom;

    if (updateData.isCompleted !== undefined)
      dataToUpdate.is_completed = updateData.isCompleted;

    if (updateData.allDay !== undefined)
      dataToUpdate.all_day = updateData.allDay;

    if (dataToUpdate.start) {
      dataToUpdate.start = new Date(dataToUpdate.start as string);
    } // Handle explicitly setting the 'end' date to null
    if (dataToUpdate.hasOwnProperty("end")) {
      dataToUpdate.end = dataToUpdate.end
        ? new Date(dataToUpdate.end as string)
        : null;
    } // Use updateMany to ensure user owns the event they're trying to update
const cleanId = id.startsWith("bloom-")
  ? id.replace("bloom-", "")
  : id;
    const updateResult = await prisma.event.updateMany({
      where: {
        id: cleanId,
        userId: session.user.id,
      },
      data: dataToUpdate,
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { message: "Event not found or permission denied" },
        { status: 404 },
      );
    } // Fetch the updated event to return it to the client

    const updatedEvent = await prisma.event.findUnique({
      where: { id },
    });

    console.log(
      "PATCH /api/events :: Successfully updated event:",
      updatedEvent,
    );
    return NextResponse.json(
      { success: true, data: updatedEvent },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("❌ PATCH /api/events :: Caught an exception:", errorMessage);
    return NextResponse.json(
      { success: false, message: "Failed to update event." },
      { status: 500 },
    );
  }
}

/** DELETE: Remove an event */
export async function DELETE(req: NextRequest) {
  console.log("🚀 DELETE /api/events :: Function called");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "An Event ID is required" },
        { status: 400 },
      );
    } // Use deleteMany to ensure the user owns the event they are deleting

    const deleteResult = await prisma.event.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    }); // If count is 0, the event either didn't exist or belonged to another user

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: "Event not found or permission denied" },
        { status: 404 },
      );
    }

    console.log(
      `DELETE /api/events :: Successfully deleted event with id: ${id}`,
    );
    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(
      "❌ DELETE /api/events :: Caught an exception:",
      errorMessage,
    );
    return NextResponse.json(
      { success: false, message: "Failed to delete event." },
      { status: 500 },
    );
  }
}
// End of file
