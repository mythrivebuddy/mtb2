import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MINUTES = 15;

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { lastSurveyTime } = user;

    // ✅ Allow if no previous survey
    if (!lastSurveyTime) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const now = new Date();
    const nextAllowedTime = new Date(lastSurveyTime.getTime() + COOLDOWN_MINUTES * 60000);

    if (now < nextAllowedTime) {
      const remainingMs = nextAllowedTime.getTime() - now.getTime();
      return NextResponse.json(
        { success: false, remainingMs },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error:unknown) {
    return NextResponse.json({ success: false, error: `Internal Server Error ${error}` }, { status: 500 });
  }
};
