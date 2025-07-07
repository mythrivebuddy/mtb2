/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";




export async function GET(request: NextRequest) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const frequency = searchParams.get("frequency");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: session.user.id,
    };

    if (status === "Pending") {
      whereClause.isCompleted = false;
    } else if (status === "Completed") {
      whereClause.isCompleted = true;
    }

    if (frequency && frequency !== "All") {
      whereClause.frequency = frequency;
    }

    // Run both queries in parallel for efficiency
    const [blooms, totalCount] = await prisma.$transaction([
      prisma.todo.findMany({
        where: whereClause,
        orderBy: { dueDate: "asc" },
        skip: skip,
        take: limit,
      }),
      prisma.todo.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: blooms,
      totalCount: totalCount,
    });
    
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch blooms" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {

    const session = await checkRole("USER");
// console.log('session', session)
  const requestBody = await req.json();
    // const { title, description, frequency, dueDate } = requestBody;
    console.log("API: Parsed request body:", requestBody);
    if (!session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    
    console.log("Before call")
    const {
  title,
  description,
  frequency,
  dueDate,
  isCompleted,
  taskAddJP,
  taskCompleteJP
} = requestBody;


  const newBloom = await prisma.todo.create({
  data: {
    title,
    description,
    frequency: frequency, 
    dueDate: dueDate ? new Date(dueDate) : null,
    isCompleted: isCompleted ?? false,
    taskAddJP: taskAddJP ?? false,
    taskCompleteJP: taskCompleteJP ?? false,
    userId: session.user.id,
  },
});

     return NextResponse.json(newBloom)
 } catch (err: any) {
  console.error("Error creating Todo:", err);

  const errorMessage = typeof err === "object" && err !== null && "message" in err
    ? err.message
    : "Unknown error";

  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
}



/*
    from Frontend requests from the state : 
    1. all  :- Pending task : isCompleted :false
    2. completed :- COmpleted task : isCompleted : true 
    3. daily :-  Only Daily Tasks : frequency : Daily
    4. And similar to both the other

*/

