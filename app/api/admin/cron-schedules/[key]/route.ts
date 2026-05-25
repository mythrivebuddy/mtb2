import { NextResponse } from "next/server";

import { updateCronSchedule } from "@/lib/cron/service";
import { isCronScheduleKey } from "@/lib/cron/constants";
import { cronScheduleUpdateSchema } from "@/lib/cron/validation";
import { checkRole } from "@/lib/utils/auth";
import type { CronKey } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    await checkRole("ADMIN");

    const { key } = await context.params;

    if (!isCronScheduleKey(key)) {
      return NextResponse.json(
        {
          success: false,
          errors: { key: ["Invalid cron schedule key"] },
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = cronScheduleUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const schedule = await updateCronSchedule(key as CronKey, validation.data);

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error("Failed to update cron schedule", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
