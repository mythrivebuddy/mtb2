import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastSurveyTime: new Date(),
      },
      select: {
        lastSurveyTime: true, // Only return what you need
      },
    });

    return NextResponse.json(
      {
        message: "lastSurveyTime updated to now",
        success: true,
        lastSurveyTime: updatedUser.lastSurveyTime,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Error marking user last survey time ${error}` },
      { status: 500 }
    );
  }
};
