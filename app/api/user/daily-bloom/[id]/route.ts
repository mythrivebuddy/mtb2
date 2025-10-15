
import { NextRequest, NextResponse } from "next/server";
import { dailyBloomSchema } from "@/schema/zodSchema";
import { prisma } from "@/lib/prisma";
// import { checkRole } from "@/lib/utils/auth";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 


/**
 * Handles GET requests for a specific Daily Bloom entry.
 * Fetches a single 'todo' item by its ID.
 *
 * @param _req - The NextRequest object (unused in this GET handler, hence _req).
 * @param params - An object containing route parameters, specifically Promise<{ id: string }>.
 * @returns A NextResponse containing the Daily Bloom entry or an error message.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Find a unique 'todo' item by its ID from the database
    const id = (await params).id
    const bloom = await prisma?.todo.findUnique({
      where: { id: id },
    });

    // If no bloom entry is found, return a 404 Not Found response
    if (!bloom) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return the found bloom entry as a JSON response
    return NextResponse.json(bloom);
  } catch (error: unknown) { // ✅ FIXED: Changed 'any' to 'unknown'
    let errorMessage = "Failed to fetch entry";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("GET Error:", errorMessage);
    // Return a 500 Internal Server Error response if fetching fails
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


/**
 * Handles PUT requests to update a specific Daily Bloom entry.
 * Validates the request body against dailyBloomSchema, updates the entry,
 * and potentially assigns JP points if the task is completed.
 *
 * @param req - The NextRequest object containing the request body.
 * @param params - An object containing route parameters, specifically Promise<{ id: string }>.
 * @returns A NextResponse containing the updated Daily Bloom entry or an error message.
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // --- START: THE FIX ---
    // Destructure the body to separate calendar-related fields
    // from the actual Todo model data.
    const { 
      addToCalendar, 
      startTime, 
      endTime, 
      //extendedProps, // Also handle extendedProps if it's being sent
      ...todoData // `todoData` now contains ONLY fields that belong to the Todo model
    } = body;
    // --- END: THE FIX ---

    // Now, validate only the data that is meant for the 'todo' table.
    // Using .partial() allows for updates without requiring all fields.
const validatedData = dailyBloomSchema._def.schema.partial().parse(todoData);

    const updatedBloom = await prisma.todo.update({
      where: { id: id, userId: session.user.id },
      data: validatedData,
    });

    if (!updatedBloom) {
      return NextResponse.json({ error: "Task not found or update failed" }, { status: 404 });
    }
    
    // --- Handle Calendar Event Logic Separately ---
    // You'll need to add your logic here to find, create, update, or delete the associated calendar event.
    // For example:
    const linkedEvent = await prisma.event.findFirst({
        // A more robust relation is better, e.g., where: { todoId: id }
        where: { title: updatedBloom.title, userId: session.user.id }
    });

    if (addToCalendar && updatedBloom.dueDate && startTime && endTime) {
        const startDateTime = new Date(`${updatedBloom.dueDate.toISOString().split('T')[0]}T${startTime}`);
        const endDateTime = new Date(`${updatedBloom.dueDate.toISOString().split('T')[0]}T${endTime}`);
        
        const eventData = {
            title: updatedBloom.title,
            start: startDateTime,
            end: endDateTime,
            all_day: false,
            userId: session.user.id,
            // todoId: id // If you have a direct relation
        };

        if (linkedEvent) {
            await prisma.event.update({ where: { id: linkedEvent.id }, data: eventData });
        } else {
            await prisma.event.create({ data: eventData });
        }
    } else if (!addToCalendar && linkedEvent) {
        // If addToCalendar is false and an event exists, delete it.
        await prisma.event.delete({ where: { id: linkedEvent.id }});
    }


    // --- JP Assignment Logic ---
    if (updatedBloom.isCompleted && !updatedBloom.taskCompleteJP) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { plan: true },
      });

      if (user) {
        try {
          await assignJp(user, ActivityType.DAILY_BLOOM_COMPLETION_REWARD);
          await prisma.todo.update({
            where: { id: updatedBloom.id },
            data: { taskCompleteJP: true },
          });
        } catch (error) {
           console.error("Error assigning JP for task completion:", error);
           // Decide if you want to fail the whole request or just log the error
        }
      }
    }

    return NextResponse.json(updatedBloom);
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("PUT Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to remove a specific Daily Bloom entry.
 * Securely deletes a 'todo' item by its ID, ensuring user ownership.
 *
 * @param _req - The NextRequest object (unused).
 * @param params - An object containing route parameters, specifically Promise<{ id:string }>.
 * @returns A NextResponse indicating successful deletion or an error message.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    if (!id) {
        return NextResponse.json({ message: "An item ID is required" }, { status: 400 });
    }

    // 2. Use `deleteMany` for robust deletion and check ownership
    const deleteResult = await prisma.todo.deleteMany({
      where: {
        id: id,
        userId: session.user.id, // IMPORTANT: Ensure the user owns this todo
      },
    });

    // 3. Check if anything was actually deleted
    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: "Daily Bloom item not found or permission denied" },
        { status: 404 }
      );
    }

    // 4. Return a success message
    console.log(`DELETE /api/user/daily-bloom :: Successfully deleted todo with id: ${id}`);
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });

  } catch (error: unknown) {
    let errorMessage = "Failed to delete";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("DELETE Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
