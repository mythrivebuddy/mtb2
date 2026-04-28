// Corrected: app/api/user/daily-bloom/route.ts

import { getServerSession } from "next-auth/next";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType, Prisma } from "@prisma/client";
import { dailyBloomSchema, DailyBloomFormType } from "@/schema/zodSchema";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { UNLIMITED } from "@/lib/access-control/featureConfig";
import { checkRole } from "@/lib/utils/auth";
//import { combineDateAndTime } from "@/lib/utils/dateUtils";

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
  frequency: "Daily" | "Weekly" | "Monthly",
): Date => {
  const nextDate = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
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
type DailyBloomPlanConfig = {
  dailyLimit: number;
  canCreateRecurringBlooms: boolean;
};

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
        userId: session.user.id,
        isCompleted: true,
        frequency: { in: ["Daily", "Weekly", "Monthly"] },
      },
    });
    const updatePromises = completedRecurringTasks
      .filter((task) => task.frequency)
      .map((task) => {
        const newDate = nextDateUTC(
          task.updatedAt,
          task.frequency as "Daily" | "Weekly" | "Monthly",
        );
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
      await prisma.$transaction(
        updatePromises as unknown as Prisma.PrismaPromise<Prisma.BatchPayload>[],
      );
    }

    const { searchParams } = request.nextUrl;
    const frequency = searchParams.get("frequency");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

    const totalAdded = await prisma.todo.count({
      where: { userId: session.user.id },
    });
    const totalCompleted = await prisma.todo.count({
      where: { userId: session.user.id, isCompleted: true },
    });

    if (status === "Pending") {
      const now = new Date();
      const startOfTodayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      const whereClause: Prisma.TodoWhereInput = {
        userId: session.user.id,
        OR: [
          // ✅ pending blooms
          {
            isCompleted: false,
            OR: [{ dueDate: null }, { dueDate: { gte: startOfTodayUTC } }],
          },

          // ✅ ALL events (past + future)
          {
            isFromEvent: true,
          },
        ],
      };

      if (frequency && frequency !== "All") {
        whereClause.frequency = frequency as "Daily" | "Weekly" | "Monthly";
      }

      const [blooms, totalCount] = await prisma.$transaction([
        prisma.todo.findMany({
          where: whereClause,
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          skip: skip,
          take: limit,
        }),
        prisma.todo.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: blooms,
        totalCount,
        dailyBloomsAdded: totalAdded,
        dailyBloomsCompleted: totalCompleted,
      });
    } else {
      const whereClause: Prisma.TodoWhereInput = { userId: session.user.id };
      if (status === "Completed") {
        whereClause.isCompleted = true;
        whereClause.dueDate = { not: null };
      }
      if (frequency && frequency !== "All") {
        whereClause.frequency = frequency as "Daily" | "Weekly" | "Monthly";
      }

      const [blooms, totalCount] = await prisma.$transaction([
        prisma.todo.findMany({
          where: whereClause,
          orderBy: [
            { dueDate: "asc" }, // calendar order
            { createdAt: "desc" },
          ],
          skip: skip,
          take: limit,
        }),
        prisma.todo.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: blooms,
        totalCount,
        dailyBloomsAdded: totalAdded,
        dailyBloomsCompleted: totalCompleted,
      });
    }
  } catch (e) {
    console.error("API Error in GET /api/user/daily-bloom:", e);
    return NextResponse.json(
      { message: "Failed to fetch blooms" },
      { status: 500 },
    );
  }
}

// --- POST Function (CORRECTED) ---
export async function POST(req: NextRequest) {
  // --- Replace the existing try...catch block in your POST function ---
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body: DailyBloomFormType = await req.json();
    const validationResult = dailyBloomSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Zod Validation Errors:", validationResult.error.errors);
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    const { startTime, endTime, addToCalendar, ...bloomData } =
      validationResult.data;
    let baseDescription = bloomData.description || "";
    baseDescription = baseDescription.replace(/\[Time:.*?\]/, "").trim();
    let finalDescription = baseDescription;
    // If times are provided, embed them into the description string
    if (addToCalendar && startTime) {
      const timeString = `[Time: ${startTime}${endTime ? `-${endTime}` : ""}]`;
      // Append the time string to the user's description
      finalDescription = `${baseDescription} ${timeString}`.trim();
    }

    const featureResult = checkFeature({
      feature: "dailyBlooms",
      user: session.user,
    });

    if (!featureResult.allowed) {
      return NextResponse.json(
        { error: featureResult.reason },
        { status: 403 },
      );
    }

    const planConfig =
      typeof featureResult.config === "object"
        ? (featureResult.config as DailyBloomPlanConfig)
        : null;

    if (!planConfig) {
      return NextResponse.json(
        { error: "Daily Bloom configuration not found" },
        { status: 500 },
      );
    }
    if (bloomData.frequency && !planConfig.canCreateRecurringBlooms) {
      return NextResponse.json(
        {
          message:
            "Recurring blooms are not available in your current plan. Please upgrade.",
        },
        { status: 403 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bloomsToday = await prisma.todo.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (
      planConfig.dailyLimit !== UNLIMITED &&
      bloomsToday >= planConfig.dailyLimit
    ) {
      return NextResponse.json(
        {
          message: `You have reached your daily limit of ${planConfig.dailyLimit} Daily Blooms.`,
        },
        { status: 403 },
      );
    }
    // Create the bloom in a single database call
    const newBloom = await prisma.todo.create({
      data: {
        ...bloomData,
        description: finalDescription || null,
        frequency: bloomData.frequency || null,
        dueDate: bloomData.dueDate ? new Date(bloomData.dueDate) : null,
        endDate: bloomData.endDate ? new Date(bloomData.endDate) : null,
        userId: userId,
        // ✅ CHANGE 1: Save the calendar flag directly to the new todo item
        isFromEvent: addToCalendar,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    // ❌ CHANGE 2: All the code that created a separate `event` record has been REMOVED.

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
        console.error(`Error while assigning GP:`, error);
      }
    }

    // ✅ CHANGE 3: Return the actual created bloom object directly in the response.
    return NextResponse.json(newBloom, { status: 201 });
  } catch (err: unknown) {
    console.error("Error creating Todo:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// --- PUT Function (CORRECTED) ---
export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  // --- Replace the existing try...catch block in your PUT function ---
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { message: "Task ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const validationResult = dailyBloomSchema._def.schema
      .partial()
      .safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    // Use the `addToCalendar` flag for `isFromEvent`
    const { addToCalendar, ...updateData } = validationResult.data;

    let baseDescription = updateData.description || "";

    // ❌ remove old time
    baseDescription = baseDescription.replace(/\[Time:.*?\]/, "").trim();

    // ✅ rebuild description with new time
    let finalDescription = baseDescription;

    if (updateData.startTime) {
      const timeString = `[Time: ${updateData.startTime}${
        updateData.endTime ? `-${updateData.endTime}` : ""
      }]`;

      finalDescription = `${baseDescription} ${timeString}`.trim();
    }

    const updatedBloom = await prisma.todo.update({
      where: { id, userId: session.user.id },
      data: {
        ...updateData,
        description: finalDescription || null,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        // ✅ CHANGE 1: Update the calendar flag on the todo item
        isFromEvent: addToCalendar,
        startTime: updateData.startTime ?? null,
        endTime: updateData.endTime ?? null,
      },
    });
    if (
      updatedBloom.alignedActionId &&
      typeof updateData.isCompleted === "boolean" &&
      updateData.isCompleted !== updatedBloom.isCompleted
    ) {
      await prisma.alignedAction.update({
        where: {
          id: updatedBloom.alignedActionId,
        },
        data: {
          completed: updateData.isCompleted,
        },
      });
    }
    // ❌ CHANGE 2: All logic that created/updated/deleted a linked event is REMOVED.

    if (updateData.isCompleted && !updatedBloom.taskCompleteJP) {
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
          console.error(`Error while assigning GP:`, error);
        }
      }
    }
    // ✅ CHANGE 3: Return the updated bloom object directly.
    return NextResponse.json(updatedBloom, { status: 200 });
  } catch (err: unknown) {
    console.error("Error updating Todo:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// --- DELETE Function (unchanged) ---
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { message: "Task ID is required" },
        { status: 400 },
      );
    }

    // await prisma.$transaction(async (tx) => {
    //   const linkedEvent = await tx.event.findFirst({
    //     where: { userId: session.user.id, title: { contains: `[ID:${id}]` }, },
    //   });

    //   if (linkedEvent) {
    //     await tx.event.delete({ where: { id: linkedEvent.id } });
    //   }

    //   await tx.todo.delete({
    //     where: { id, userId: session.user.id },
    //   });
    // });
    await prisma.todo.delete({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json(
      { message: "Daily Bloom deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting Todo:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
