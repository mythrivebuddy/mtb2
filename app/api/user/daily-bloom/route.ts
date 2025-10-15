// Corrected: app/api/user/daily-bloom/route.ts

import { getServerSession } from "next-auth/next";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType, Prisma } from "@prisma/client";
import { dailyBloomSchema, DailyBloomFormType } from "@/schema/zodSchema";
import { combineDateAndTime } from "@/lib/utils/dateUtils";

// --- authOptions (unchanged) ---
const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// --- nextDateUTC helper (unchanged) ---
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


// --- GET Function (unchanged) ---
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Recurring task logic
    const nowForRecurrence = new Date();
    const completedRecurringTasks = await prisma.todo.findMany({
      where: {
        userId: session.user.id, isCompleted: true, frequency: { in: ["Daily", "Weekly", "Monthly"] },
      },
    });
    const updatePromises = completedRecurringTasks
        .filter(task => task.frequency)
        .map(task => {
            const newDate = nextDateUTC(task.updatedAt, task.frequency as "Daily" | "Weekly" | "Monthly");
            if (newDate <= nowForRecurrence) {
                return prisma.todo.update({
                    where: { id: task.id },
                    data: { isCompleted: false, dueDate: null },
                });
            }
            return null;
        })
        .filter(Boolean);
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises as unknown as Prisma.PrismaPromise<Prisma.BatchPayload>[]);
    }

    const { searchParams } = request.nextUrl;
    const frequency = searchParams.get("frequency");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

    const totalAdded = await prisma.todo.count({ where: { userId: session.user.id } });
    const totalCompleted = await prisma.todo.count({ where: { userId: session.user.id, isCompleted: true } });

    if (status === "Pending") {
      const now = new Date();
      const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      
      const whereClause: Prisma.TodoWhereInput = {
        userId: session.user.id,
        isCompleted: false,
        OR: [
          { dueDate: null },
          { dueDate: { gte: startOfTodayUTC } }
        ]
      };

      if (frequency && frequency !== "All") {
        whereClause.frequency = frequency as "Daily" | "Weekly" | "Monthly";
      }

      const [blooms, totalCount] = await prisma.$transaction([
        prisma.todo.findMany({
          where: whereClause,
          orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip: skip,
          take: limit,
        }),
        prisma.todo.count({ where: whereClause }),
      ]);

      return NextResponse.json({ data: blooms, totalCount, dailyBloomsAdded: totalAdded, dailyBloomsCompleted: totalCompleted });

    } else {
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
          orderBy: { updatedAt: "desc" },
          skip: skip,
          take: limit,
        }),
        prisma.todo.count({ where: whereClause }),
      ]);

      return NextResponse.json({ data: blooms, totalCount, dailyBloomsAdded: totalAdded, dailyBloomsCompleted: totalCompleted });
    }
  } catch (e) {
    console.error("API Error in GET /api/user/daily-bloom:", e);
    return NextResponse.json(
      { message: "Failed to fetch blooms" },
      { status: 500 }
    );
  }
}


// --- POST Function (CORRECTED) ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body: DailyBloomFormType = await req.json();
    const validationResult = dailyBloomSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Zod Validation Errors:", validationResult.error.errors);
      return NextResponse.json({ message: "Invalid data", errors: validationResult.error.flatten() }, { status: 400 });
    }

    const {
      addToCalendar,
      startTime,
      endTime,
      ...bloomData
    } = validationResult.data;

    const newBloom = await prisma.$transaction(async (tx) => {
      const createdBloom = await tx.todo.create({
        data: {
          ...bloomData,
          description: bloomData.description || null,
          frequency: bloomData.frequency || null,
          dueDate: bloomData.dueDate ? new Date(bloomData.dueDate) : null,
          userId: userId,
        },
      });

      if (addToCalendar && createdBloom.dueDate && startTime && endTime) {
        const startDateTime = combineDateAndTime(createdBloom.dueDate, startTime);
        const endDateTime = combineDateAndTime(createdBloom.dueDate, endTime);

        await tx.event.create({
          data: {
            // FIX: Removed the ID from the title
            title: createdBloom.title,
            start: startDateTime,
            end: endDateTime,
            all_day: false,
            userId: userId,
          },
        });
      }

      return createdBloom;
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (user && !newBloom.taskAddJP) {
      try {
        await assignJp(user, ActivityType.DAILY_BLOOM_CREATION_REWARD);
        await prisma.todo.update({
          where: { id: newBloom.id },
          data: { taskAddJP: true },
        });
      } catch (error) {
        console.error(`Error while assigning JP:`, error);
      }
    }

    return NextResponse.json(
      { message: "Daily Bloom created successfully", newBloom },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Error creating Todo:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// --- PUT Function (CORRECTED) ---
export async function PUT(req: NextRequest) {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = dailyBloomSchema._def.schema.partial().safeParse(body);

    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid data", errors: validationResult.error.flatten() }, { status: 400 });
    }

    const { title, description, dueDate, frequency, isCompleted, addToCalendar, startTime, endTime } = validationResult.data;

    const updatedBloom = await prisma.todo.update({
        where: { id, userId: session.user.id },
        data: {
            title,
            description: description || undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            frequency,
            isCompleted,
        },
    });

    if (!updatedBloom) {
        return NextResponse.json({ error: "Task not found or update failed" }, { status: 404 });
    }

    const linkedEvent = await prisma.event.findFirst({
        where: { userId: session.user.id, title: { contains: `[ID:${id}]` }, },
    });

    if (addToCalendar && dueDate && startTime && endTime) {
        const startDateTime = combineDateAndTime(dueDate, startTime);
        const endDateTime = combineDateAndTime(dueDate, endTime);

        if (linkedEvent) {
            await prisma.event.update({
                where: { id: linkedEvent.id },
                data: {
                    // FIX: Removed the ID from the title
                    title: title || updatedBloom.title,
                    start: startDateTime,
                    end: endDateTime,
                },
            });
        } else {
            await prisma.event.create({
                data: {
                    // FIX: Removed the ID from the title
                    title: title || updatedBloom.title,
                    start: startDateTime,
                    end: endDateTime,
                    all_day: false,
                    userId: session.user.id,
                },
            });
        }
    } else if (linkedEvent) {
        await prisma.event.delete({ where: { id: linkedEvent.id } });
    }

    if (isCompleted && !updatedBloom.taskCompleteJP) {
       const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { plan: true },
        });

        if (user) {
            try {
                await assignJp(user, ActivityType.DAILY_BLOOM_COMPLETION_REWARD);
                await prisma.todo.update({
                    where: { id },
                    data: { taskCompleteJP: true },
                });
            } catch (error) {
                console.error(`Error while assigning JP:`, error);
            }
        }
    }

    return NextResponse.json(
      { message: "Daily Bloom updated successfully", updatedBloom, },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error updating Todo:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- DELETE Function (unchanged) ---
export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            const linkedEvent = await tx.event.findFirst({
                where: { userId: session.user.id, title: { contains: `[ID:${id}]` }, },
            });

            if (linkedEvent) {
                await tx.event.delete({ where: { id: linkedEvent.id } });
            }

            await tx.todo.delete({
                where: { id, userId: session.user.id },
            });
        });

        return NextResponse.json({ message: "Daily Bloom deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting Todo:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

