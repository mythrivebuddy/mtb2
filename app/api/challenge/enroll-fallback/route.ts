import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { safeInngestSend } from "@/lib/utils/inngest/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId, orderId } = await request.json();

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    // Trigger the background job
    await safeInngestSend({
      name: "challenge-enrollment.fallback",
      data: {
        userId: session.user.id,
        challengeId,
        orderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fallback trigger failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}