import { checkRole } from "@/lib/utils/auth"; 
import {  NextResponse } from "next/server";
import {prisma} from "@/lib/prisma"; 


export async function GET() {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // --- TIMEZONE-SAFE FIX START ---

    // 1. Get the current moment.
    const now = new Date();

    // 2. Create a new Date object that represents the start of the current day in UTC.
    // This effectively strips away the time and timezone information, giving us a clean
    // "midnight UTC" timestamp to compare against.
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // --- TIMEZONE-SAFE FIX END ---

    const overdueBlooms = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        isCompleted: false,
        dueDate: {
          // 3. The query now correctly finds tasks with a due date strictly *before*
          //    the start of the current day in UTC.
          lt: startOfTodayUTC,
          not: null,
        },
      },
      orderBy: {
        dueDate: 'asc',
      }
    });

    return NextResponse.json({
      message: "Overdue blooms fetched successfully",
      data: overdueBlooms,
    }, { status: 200 });

  } catch (e) {
    console.error("Failed to fetch overdue blooms:", e);
    return NextResponse.json(
      { message: "An internal server error occurred while fetching overdue blooms." },
      { status: 500 }
    );
  }
}
