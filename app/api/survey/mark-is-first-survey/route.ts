import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const userId = body?.userId;

    if (!userId) {
      console.error("Missing userId in request body");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 🔍 Check user existence and current survey state
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isFirstTimeSurvey: true },
    });

    if (!user) {
      console.error("User not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isFirstTimeSurvey === false) {
      console.log("User already marked first-time survey");
      return NextResponse.json({ success: true, message: "Already marked" }, { status: 200 });
    }

    // ✅ Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isFirstTimeSurvey: false },
      select: { id: true, isFirstTimeSurvey: true }, // Return updated value
    });

    console.log("Updated user survey flag:", updatedUser);

    return NextResponse.json({
      success: true,
      message: "Marked first survey as complete",
      user: updatedUser,
    }, { status: 200 });

  } catch (error) {
    console.error("Survey update failed:", error);
    return NextResponse.json(
      { error: "Failed to update first-time survey", detail: String(error) },
      { status: 500 }
    );
  }
};
