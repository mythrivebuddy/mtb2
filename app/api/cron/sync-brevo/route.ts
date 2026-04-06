import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitFullName } from "@/lib/utils/utils";
import { addOrUpdateBrevoContact } from "@/lib/brevo";

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        userType: true,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const { firstName, lastName } = splitFullName(user.name);

        await addOrUpdateBrevoContact({
          email: user.email,
          firstName,
          lastName,
          userType: user.userType,
        });

        successCount++;
      } catch (error) {
        console.log("Failed error for user:", user.email, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: "Brevo sync completed",
      totalUsersProcessed: users.length,
      success: successCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error("Error syncing with Brevo:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
