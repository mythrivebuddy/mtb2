import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import moment from "moment";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Get pending aligned actions for the user
    const now = moment();
    
    // Extended window to catch actions that might have been missed
    const fifteenMinutesAgo = now.clone().subtract(15, 'minutes').toDate();
    const fifteenMinutesAhead = now.clone().add(15, 'minutes').toDate();
    
    // Check if user already has a completed action today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedActionToday = await prisma.alignedAction.findFirst({
      where: {
        userId: user.id,
        completed: true,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Don't return pending actions if the user has already completed one today
    if (completedActionToday) {
      return NextResponse.json(
        { actions: [] },
        { status: 200 }
      );
    }

    // Also check Progress Vault limit
    const progressVaultEntriesToday = await prisma.progressVault.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        deletedAt: null
      }
    });

    // If there are already 3 Progress Vault entries today, don't return any pending actions
    if (progressVaultEntriesToday >= 3) {
      return NextResponse.json(
        { actions: [] },
        { status: 200 }
      );
    }

    const pendingActions = await prisma.alignedAction.findMany({
      where: {
        userId: user.id,
        scheduledTime: {
          gte: fifteenMinutesAgo,
          lte: fifteenMinutesAhead,
        },
        completed: false,
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });
    
    return NextResponse.json(
      { actions: pendingActions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending actions:", error);
    let errorMessage = "Failed to fetch pending actions";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 