// /app/api/survey/mark-is-first-survey/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isFirstTimeSurvey: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isFirstTimeSurvey === false) {
      return NextResponse.json({ success: true, message: "Already marked" }, { status: 200 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isFirstTimeSurvey: false },
    });

    return NextResponse.json({ success: true, message: "Marked first survey as complete" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update first-time survey: ${error}` },
      { status: 500 }
    );
  }
};
