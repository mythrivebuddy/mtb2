import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

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
    
    // Get the start and end of the current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if user has any completed aligned actions today
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
    
    // Also check if the Progress Vault has reached its limit
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
    
    const hasCompletedToday = !!completedActionToday || progressVaultEntriesToday >= 3;
    
    return NextResponse.json({
      hasCompletedToday,
      progressVaultCount: progressVaultEntriesToday
    });
  } catch (error) {
    console.error("Error checking completed actions:", error);
    
    return NextResponse.json(
      { message: "Failed to check completed actions", hasCompletedToday: false },
      { status: 500 }
    );
  }
} 