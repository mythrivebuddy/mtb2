import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType, Prisma } from "@prisma/client";
import { DailyBloomFormType } from "@/schema/zodSchema";

const nextDateUTC = (
  startDate: Date,
  frequency: "Daily" | "Weekly" | "Monthly"
): Date => {
  const nextDate = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    )
  );

  if (frequency === "Daily") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  } else if (frequency === "Weekly") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  } else if (frequency === "Monthly") {
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  }
  return nextDate;
};

export async function GET(request: NextRequest) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // --- Recurring Task Logic (Unchanged) ---
    const nowForRecurrence = new Date();
    const completedRecurringTasks = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true,
        frequency: { in: ["Daily", "Weekly", "Monthly"] },
      },
    });

    const updatePromises = [];
    for (const task of completedRecurringTasks) {
      if (task.frequency) {
        const newDate = nextDateUTC(
          task.updatedAt,
          task.frequency as "Daily" | "Weekly" | "Monthly"
        );
        if (newDate <= nowForRecurrence) {
          updatePromises.push(
            prisma.todo.update({
              where: { id: task.id },
              data: { isCompleted: false, dueDate: newDate },
            })
          );
        }
      }
    }
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }
    // --- End of Recurring Task Logic ---

    const { searchParams } = request.nextUrl;
    const frequency = searchParams.get("frequency");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

    // --- NEW LOGIC: Handle "Pending" with special sorting, others normally ---

    if (status === "Pending") {
      // Use the advanced raw query for custom sorting
      const now = new Date();
      const startOfTodayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const startOfTomorrowUTC = new Date(startOfTodayUTC);
      startOfTomorrowUTC.setUTCDate(startOfTomorrowUTC.getUTCDate() + 1);

      const userId = session.user.id;

      // Build the WHERE clause dynamically for the raw query
      const whereConditions = [
        Prisma.sql`"userId" = ${userId}`,
        Prisma.sql`"isCompleted" = false`,
        Prisma.sql`("dueDate" IS NULL OR "dueDate" >= ${startOfTodayUTC})`,
      ];
      if (frequency && frequency !== "All") {
        whereConditions.push(Prisma.sql`"frequency" = ${frequency}`);
      }
      const whereSql = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;

      // The raw query that creates and sorts by a custom priority level
      const blooms = await prisma.$queryRaw`
        SELECT * FROM "Todo"
        ${whereSql}
        ORDER BY
          CASE
            WHEN "dueDate" >= ${startOfTodayUTC} AND "dueDate" < ${startOfTomorrowUTC} THEN 1
            WHEN "frequency" = 'Daily' THEN 2
            ELSE 3
          END ASC,
          "dueDate" ASC,
          "createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip};
      `;

      // We also need the total count for pagination using the same WHERE clause
      const countResult: { count: bigint }[] = await prisma.$queryRaw`
        SELECT COUNT(*) FROM "Todo"
        ${whereSql}
      `;
      const totalCount = Number(countResult[0].count);

      return NextResponse.json({ data: blooms, totalCount });
    } else {
      // For "Completed" or any other status, use the simple, original logic
      const whereClause: Prisma.TodoWhereInput = { userId: session.user.id };
      if (status === "Completed") {
        whereClause.isCompleted = true;
      }
      if (frequency && frequency !== "All") {
        whereClause.frequency = frequency as "Daily" | "Weekly" | "Monthly";
      }

      const [blooms, totalCount] = await prisma.$transaction([
        prisma.todo.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip: skip,
          take: limit,
        }),
        prisma.todo.count({ where: whereClause }),
      ]);

      return NextResponse.json({ data: blooms, totalCount });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch blooms" },
      { status: 500 }
    );
  }
}

// The POST function remains completely unchanged.
export async function POST(req: NextRequest) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const requestBody: DailyBloomFormType = await req.json();
    const {
      title,
      description,
      frequency,
      dueDate,
      isCompleted,
      taskAddJP,
      taskCompleteJP,
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

    if (!newBloom) {
      return NextResponse.json(
        { error: "Error while creating a Daily Bloom", success: false },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    });

    if (user) {
      try {
        await assignJp(user, ActivityType.DAILY_BLOOM_CREATION_REWARD);
        await prisma.todo.update({
          where: { id: newBloom.id },
          data: { taskAddJP: true },
        });
      } catch (error) {
        console.error(
          `Error while assigning JP when daily bloom is created:`,
          error
        );
      }
    }

    return NextResponse.json({
      message: "Daily Bloom created successfully",
      newBloom,
    });
  } catch (err: unknown) {
    console.error("Error creating Todo:", err);

    const errorMessage =
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof err.message === "string"
        ? err.message
        : "Unknown error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
