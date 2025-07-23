import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSurveyTime: new Date() },
    });

    return NextResponse.json({ success: true, message: "Survey time updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update lastSurveyTime: ${error}` },
      { status: 500 }
    );
  }
};
