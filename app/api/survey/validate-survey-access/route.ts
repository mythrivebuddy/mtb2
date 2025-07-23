import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSurveyTime: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = Date.now();
    const last = user.lastSurveyTime?.getTime() ?? 0;
    const cooldownMs = 15* 60 * 1000;

    if (now - last < cooldownMs) {
      const remaining = cooldownMs - (now - last);
      return NextResponse.json({
        success: false,
        message: `Cooldown not expired`,
        remainingMs: remaining,
      }, { status: 403 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: `Server error validating access: ${error}` },
      { status: 500 }
    );
  }
};
