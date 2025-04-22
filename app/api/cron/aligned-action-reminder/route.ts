import { NextResponse } from "next/server";
import axios from "axios";

// This is a special API route meant to be called by Vercel Cron or a similar service
// It triggers the reminder email sending process for aligned actions

// Configure Vercel Cron to call this endpoint every minute
export const config = {
  runtime: "edge",
};

export async function GET() {
  try {
    // Get the base URL from environment variables or generate it
    const baseUrl = process.env.NEXT_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    // Call the reminder endpoint
    const response = await axios.get(`${baseUrl}/api/aligned-action/reminder`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reminderResult: response.data,
    });
  } catch (error) {
    console.error('Error in reminder cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 