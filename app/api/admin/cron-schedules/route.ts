import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createCronSchedule,
  listCronSchedules,
} from "@/lib/cron/service";
import { cronScheduleCreateSchema } from "@/lib/cron/validation";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    await checkRole("ADMIN");

    const schedules = await listCronSchedules();

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Failed to list cron schedules", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await checkRole("ADMIN");

    const body = await req.json();
    const validation = cronScheduleCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const schedule = await createCronSchedule(validation.data);

    return NextResponse.json(
      { success: true, data: schedule },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: { key: ["Cron schedule already exists"] },
        },
        { status: 409 }
      );
    }

    console.error("Failed to create cron schedule", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
