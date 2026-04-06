import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitFullName } from "@/lib/utils/utils";
import { addOrUpdateBrevoContact } from "@/lib/brevo";
import { PlanUserType } from "@prisma/client";

function isAuthorized(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

interface UserRecord {
  email: string;
  name: string | null;
  userType: PlanUserType | null;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users: UserRecord[] = await prisma.user.findMany({
      where: {
        userType: {
          not: null,
        },
        OR: [
          { isInBrevo: false },
          { isInBrevo: true, brevoUserTypeSynced: false },
        ],
      },
      select: {
        email: true,
        name: true,
        userType: true,
      },
    });

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (!user.userType) continue;

        const { firstName, lastName } = splitFullName(user.name);

        await addOrUpdateBrevoContact({
          email: user.email,
          firstName,
          lastName,
          userType: user.userType,
        });

        await prisma.user.update({
          where: { email: user.email },
          data: {
            isInBrevo: true,
            brevoUserTypeSynced: true,
          },
        });

        success++;

        // Brevo rate limit safety
        await new Promise((res) => setTimeout(res, 150));
      } catch (error) {
        console.error("Brevo sync failed for:", user.email);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Brevo sync cron completed",
      processed: users.length,
      success,
      failed,
    });
  } catch (error) {
    console.error("Brevo sync cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}