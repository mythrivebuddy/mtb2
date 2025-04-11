import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function GET() {
  try {
    const session = await checkRole("USER");
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.progressVault.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.log("error",error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await checkRole("USER");
    
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
    
    const logsToday = await prisma.progressVault.count({
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

    // Create the progress vault entry
    const log = await prisma.progressVault.create({
      data: {
        content,
        userId: session.user.id,
      },
    });

    // Get user with plan information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }
    });

    if (user) {
      try {
        // Check daily JP limit before assigning JP
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all JP transactions for today
        const jpTransactionsToday = await prisma.transaction.count({
          where: {
            userId: session.user.id,
            createdAt: {
              gte: today
            }
          }
        });
        
        // Get the JP amount for this activity
        const activityData = await prisma.activity.findUnique({
          where: { activity: ActivityType.PROGRESS_VAULT }
        });
        
        if (activityData) {
          // Set JP amount to 50 for this activity
          await prisma.activity.update({
            where: { activity: ActivityType.PROGRESS_VAULT },
            data: { jpAmount: 50 }
          });
          
          const totalJpToday = jpTransactionsToday * 50;
          
          // If we've hit the daily limit, don't award any more JP
          if (totalJpToday >= 150) {
            throw new Error("Daily JP limit reached");
          }
        }
        
        // Assign JP points for the progress vault
        await assignJp(user, ActivityType.PROGRESS_VAULT);
      } catch (error) {
        // If the error is about daily JP limit, we still want to return the log
        if (error instanceof Error && error.message.includes("Daily JP limit")) {
          console.log("Daily JP limit reached, but log was created");
          // Return the log but include a warning about JP limit
          return NextResponse.json({
            log,
            warning: "Progress vault created, but you've reached the daily JP limit of 150"
          });
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error creating progress vault:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create log" },
      { status: 500 }
    );
  }
} 