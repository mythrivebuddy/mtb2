import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {prisma} from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { authConfig } from "../../auth/[...nextauth]/auth.config";
import { ActivityType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.miracleLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ message: "Valid content is required" }, { status: 400 });
    }

    // Check daily limit for logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logsToday = await prisma.miracleLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    if (logsToday >= 3) {
      return NextResponse.json(
        { message: "Daily limit of 3 logs reached" },
        { status: 400 }
      );
    }

    const log = await prisma.miracleLog.create({
      data: {
        content,
        userId: session.user.id,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }
    });

    if (user) {
      try {
        await assignJp(user, ActivityType.MIRACLE_LOG);
      } catch (error) {
        // If the error is about daily JP limit, we still want to return the log
        if (error instanceof Error && error.message.includes("Daily JP limit")) {
          console.log("Daily JP limit reached, but log was created");
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
    }

    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create log" },
      { status: 500 }
    );
  }
} 