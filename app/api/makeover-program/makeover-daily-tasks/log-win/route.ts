// /api/makeover-program/makeover-daily-tasks/log-win
import { NextRequest, NextResponse } from "next/server";
import { createLogWin } from "@/lib/utils/makeover-program/makeover-daily-tasks/createLogWin";
import { checkRole } from "@/lib/utils/auth";

/* ---------------------------------- */
/* POST: Save up to 3 log wins         */
/* ---------------------------------- */

export async function POST(req: NextRequest) {
  try {
    /** 1️⃣ Auth */
    const session = await checkRole("USER");

    /** 2️⃣ Parse body */
    const body = await req.json();
    const contents: string[] = body?.contents;

    if (!Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json(
        { error: "contents must be a non-empty array" },
        { status: 400 }
      );
    }

    if (contents.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 log wins allowed per day" },
        { status: 400 }
      );
    }

    /** 3️⃣ Create logs */
    const results = [];

    for (const content of contents) {
      if (!content?.trim()) continue;

      const result = await createLogWin({
        userId: session.user.id,
        content: content.trim(),
      });

      results.push(result);
    }

    /** 4️⃣ Success */
    return NextResponse.json(
      {
        success: true,
        message: "Log wins saved",
        count: results.length,
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create log wins failed:", error);

    if (
      error instanceof Error &&
      error.message === "DAILY_LOG_LIMIT_REACHED"
    ) {
      return NextResponse.json(
        {
          error: "Daily limit of 3 log wins reached",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save log wins",
      },
      { status: 500 }
    );
  }
}
