import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { AlignedActionFormData, getMoodEmoji } from "@/lib/utils/aligned-action-form";
import moment from "moment";

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the form data
    const formData: AlignedActionFormData = await request.json();
    
    // Debug log to help diagnose issues
    console.log("Received form data:", JSON.stringify(formData, null, 2));
    
    // Validate that all required data exists
    if (!formData.step1 || !formData.step2 || !formData.step3) {
      return NextResponse.json(
        { message: "Missing required form data" },
        { status: 400 }
      );
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user already has an aligned action for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingActionToday = await prisma.alignedAction.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    if (existingActionToday) {
      return NextResponse.json(
        { message: "You can only create one aligned action per day." },
        { status: 400 }
      );
    }

    // Check if Progress Vault already has 3 entries for today
    const progressVaultEntriesToday = await prisma.progressVault.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        deletedAt: null // Only count non-deleted entries
      }
    });
    
    if (progressVaultEntriesToday >= 3) {
      return NextResponse.json(
        { message: "You already have 3 entries in your Progress Vault today. Complete them before creating a new aligned action." },
        { status: 400 }
      );
    }
    
    // Safely parse dates from the form data
    let selectedTime, secondaryTime, reminderTime;
    
    try {
      // Handle different date formats that might come from the client
      selectedTime = moment(formData.step3.selectedTime).toDate();
      secondaryTime = moment(formData.step3.secondaryTime).toDate();
      
      // Calculate reminder time (EXACTLY 5 minutes before the selected time)
      reminderTime = moment(selectedTime).subtract(5, 'minutes').toDate();
      
      // Validate that the dates are valid
      if (!selectedTime || !secondaryTime || isNaN(selectedTime.getTime()) || isNaN(secondaryTime.getTime())) {
        throw new Error("Invalid date format");
      }
      
      // Ensure the action time is in the future and at least 6 minutes away
      const now = new Date();
      const sixMinutesFromNow = moment(now).add(6, 'minutes').toDate();
      
      if (selectedTime < sixMinutesFromNow) {
        return NextResponse.json(
          { message: "Selected time must be at least 6 minutes in the future (to allow for reminder emails)" },
          { status: 400 }
        );
      }
      
      // Ensure the reminder time is at least 30 seconds in the future
      const minimumReminderTime = moment(now).add(30, 'seconds').toDate();
      if (reminderTime < minimumReminderTime) {
        console.warn("Reminder time too close to now, adjusting to minimum time");
        reminderTime = minimumReminderTime;
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return NextResponse.json(
        { message: "Invalid date format provided" },
        { status: 400 }
      );
    }
    
    // Format the task types for display
    const taskTypes = formData.step2.taskTypes.map(type => {
      return type
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
    }).join(", ");
    
    // Format the scheduled time using moment.js
    const scheduledTimeFormatted = moment(selectedTime).format("MMM D, YYYY [at] h:mm A");
    const secondaryTimeFormatted = moment(secondaryTime).format("MMM D, YYYY [at] h:mm A");
    const reminderTimeFormatted = moment(reminderTime).format("MMM D, YYYY [at] h:mm A");
    
    console.log(`Action scheduled for: ${scheduledTimeFormatted}`);
    console.log(`Reminder email scheduled for: ${reminderTimeFormatted} (exactly 5 minutes before action time)`);
    
    // Store the aligned action in the database
    const alignedAction = await prisma.alignedAction.create({
      data: {
        userId: user.id,
        mood: formData.step1.mood,
        summaryType: "", // This field is no longer used but kept for DB compatibility
        taskTypes: formData.step2.taskTypes,
        scheduledTime: selectedTime,
        secondaryTime: secondaryTime, 
        selectedOption: formData.step2.selectedOption,
        reminderTime,
        completed: false,
      },
    });
    
    // Get the email API key
    const brevoApiKey = process.env.BREVO_API_KEY;
    
    if (!brevoApiKey) {
      console.warn("BREVO_API_KEY is not defined - skipping email sending");
      
      // Return success response even without sending emails (for development)
      return NextResponse.json(
        {
          message: "Aligned action scheduled successfully (emails skipped - no API key)",
          actionId: alignedAction.id,
        },
        { status: 201 }
      );
    }
    
    
    try {
      // Send a confirmation email immediately
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: {
            name: "MyThriveBuddy",
            email: "alifaizan15245@gmail.com",
          },
          to: [
            {
              email: user.email,
              name: user.name,
            },
          ],
          subject: "Aligned Action Scheduled Successfully",
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4F46E5;">Aligned Action Confirmation</h2>
                  <p>Hello ${user.name || "there"},</p>
                  <p>Your aligned action has been scheduled successfully!</p>
                  
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #4B5563;">Action Details:</h3>
                    <p><strong>Mood:</strong> ${getMoodEmoji(formData.step1.mood)} ${formData.step1.mood}</p>
                    <p><strong>Task Types:</strong> ${taskTypes}</p>
                    <p><strong>Selected Task:</strong> ${formData.step2.selectedOption}</p>
                    <p><strong>Primary Time:</strong> ${scheduledTimeFormatted}</p>
                    <p><strong>Secondary Time:</strong> ${secondaryTimeFormatted}</p>
                    <p><strong>Reminder Email:</strong> ${reminderTimeFormatted} (5 minutes before action time)</p>
                    <p><strong>Notes:</strong></p>
                    <ul>
                      ${formData.step1.notes.map(note => note ? `<li>${note}</li>` : '').join('')}
                    </ul>
                  </div>
                  
                  <p>You'll receive a reminder 5 minutes before your scheduled time.</p>
                  <p>Remember: You can only create one aligned action per day and earn 50 Joy Pearls per day from aligned actions.</p>
                  <p>Thank you for using MyThriveBuddy!</p>
                </div>
              </body>
            </html>
          `,
        },
        {
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (emailError) {
      console.error("Failed to send emails:", emailError instanceof Error ? emailError.message : String(emailError));
      if (axios.isAxiosError(emailError)) {
        console.error("Email error details:", emailError.response?.data);
      } else {
        console.error("Failed to send emails:", emailError);
      }
      }
      
      // Continue with success response even if emails fail
      // We'll just log the error but still consider the action created
    
    
    return NextResponse.json(
      {
        message: "Aligned action scheduled successfully",
        actionId: alignedAction.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating aligned action:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to schedule aligned action";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// Handler for when user completes the action
export async function PATCH(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the request data
    const data = await request.json();
    const { actionId, completed } = data;
    
    if (!actionId) {
      return NextResponse.json(
        { message: "Action ID is required" },
        { status: 400 }
      );
    }
    
    // Get the user from the database with plan info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // If the action is being marked as completed, check if the user already has a completed action today
    if (completed) {
      // Get the start and end of the current day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if user already has completed an aligned action today
      const existingCompletedAction = await prisma.alignedAction.findFirst({
        where: {
          userId: user.id,
          completed: true,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          id: { not: actionId } // Exclude the current action
        }
      });
      
      // Also check Progress Vault limit
      const progressVaultEntriesToday = await prisma.progressVault.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          deletedAt: null // Only count non-deleted entries
        }
      });
      
      // If user already has a completed action or has reached the Progress Vault limit, return appropriate message
      if (existingCompletedAction || progressVaultEntriesToday >= 3) {
        // Still update the aligned action to mark it as completed
        await prisma.alignedAction.update({
          where: {
            id: actionId,
            userId: user.id,
          },
          data: {
            completed: true,
          },
        });
        
        return NextResponse.json({
          message: "Action marked as completed, but daily limit for Joy Pearls and Progress Vault entries reached",
          actionId,
          completed: true,
          dailyLimitReached: true
        });
      }
    }
    
    // Update the aligned action
    const updatedAction = await prisma.alignedAction.update({
      where: {
        id: actionId,
        userId: user.id,
      },
      data: {
        completed,
      },
    });
    
    // If the action was completed, assign Joy Pearls and save to Progress Vault
    if (completed) {
      // Check if this action already has a Progress Vault entry
      const existingProgressVaultEntry = await prisma.progressVault.findFirst({
        where: {
          userId: user.id,
          content: {
            contains: `${updatedAction.selectedOption} (1% progress)`
          },
          deletedAt: null
        }
      });

      // Find the ALIGNED_ACTION activity
      const activity = await prisma.activity.findUnique({
        where: { activity: "ALIGNED_ACTION" as ActivityType },
      });
      
      if (activity) {
        // Add JP points directly
        await prisma.user.update({
          where: { id: user.id },
          data: {
            jpEarned: { increment: activity.jpAmount },
            jpBalance: { increment: activity.jpAmount },
            jpTransaction: { increment: activity.jpAmount },
            transaction: {
              create: {
                activityId: activity.id,
                jpAmount: activity.jpAmount,
              },
            },
          },
        });
      }
      
      // Save to Progress Vault with a better formatted description
      // Only if there isn't already an entry for this action
      if (!existingProgressVaultEntry) {
        await prisma.progressVault.create({
          data: {
            userId: user.id,
            content: `${updatedAction.selectedOption}`,
            jpPointsAssigned: true,
          },
        });
      }
    }
    
    return NextResponse.json(
      {
        message: "Aligned action updated successfully",
        actionId: updatedAction.id,
        completed,
        dailyLimitReached: false
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating aligned action:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to update aligned action";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 