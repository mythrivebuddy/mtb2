import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import moment from "moment";
import { getMoodEmoji } from "@/lib/utils/aligned-action-form";


// This API route checks for upcoming aligned actions and sends reminder emails
// 5 minutes before the scheduled time
export async function GET() {
  try {
    // Calculate the time window for upcoming actions
    // Look for actions 5-6 minutes from now (those that need reminders sent now)
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
    
    console.log(`Checking for aligned actions scheduled between ${fiveMinutesFromNow.toISOString()} and ${sixMinutesFromNow.toISOString()}`);
    
    // Find all actions scheduled 5-6 minutes from now
    const upcomingActions = await prisma.alignedAction.findMany({
      where: {
        scheduledTime: {
          gte: fiveMinutesFromNow,
          lt: sixMinutesFromNow,
        },
        completed: false,
      },
      include: {
        user: true,
      },
    });
    
    console.log(`Found ${upcomingActions.length} upcoming actions that need reminders`);
    
    // If no upcoming actions, return early
    if (upcomingActions.length === 0) {
      return NextResponse.json({
        message: "No upcoming actions found that need reminders",
        sentCount: 0,
      });
    }
    
    // Get the email API key
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.CONTACT_SENDER_EMAIL || "alifaizan15245@gmail.com";
    
    if (!brevoApiKey) {
      console.warn("BREVO_API_KEY is not defined - skipping email sending");
      return NextResponse.json(
        {
          message: "No API key provided for email service",
          sentCount: 0,
        },
        { status: 400 }
      );
    }
    
    // Keep track of successfully sent emails
    let successCount = 0;
    
    // Send reminder email for each upcoming action
    for (const action of upcomingActions) {
      try {
        // Format times for display
        const scheduledTimeFormatted = moment(action.scheduledTime).format("MMM D, YYYY [at] h:mm A");
        const secondaryTimeFormatted = action.secondaryTime 
          ? moment(action.secondaryTime).format("MMM D, YYYY [at] h:mm A") 
          : "N/A";
        
        // Format task types for display
        const taskTypes = action.taskTypes.map(type => {
          // Convert camelCase to Title Case
          return type
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
        }).join(", ");
        
        // Prepare the email content
        const emailSubject = "Reminder: Your Aligned Action is Starting Soon";
        const emailBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Your Aligned Action Reminder</h2>
                <p>Hello ${action.user.name || "there"},</p>
                <p>This is a reminder that your scheduled aligned action is starting in 5 minutes.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #4B5563;">Action Details:</h3>
                  <p><strong>Mood:</strong> ${getMoodEmoji(action.mood as "Sleepy" | "Good To Go" | "Motivated" | "Highly Motivated")} ${action.mood}</p>
                  <p><strong>Task Types:</strong> ${taskTypes}</p>
                  <p><strong>Selected Task:</strong> ${action.selectedOption || "Not specified"}</p>
                  <p><strong>Primary Time:</strong> ${scheduledTimeFormatted}</p>
                  <p><strong>Secondary Time:</strong> ${secondaryTimeFormatted}</p>
                  <p><strong>Notes:</strong></p>
                  <ul>
                    ${action.notes.map(note => note ? `<li>${note}</li>` : '').join('')}
                  </ul>
                </div>
                
                <p>Remember, once you complete this aligned action:</p>
                <ul>
                  <li>You'll earn +50 Joy Pearls</li>
                  <li>Your task will be saved to your Progress Vault</li>
                </ul>
                
                <p>Good luck!</p>
                <p>The MyThriveBuddy Team</p>
              </div>
            </body>
          </html>
        `;
        
        // Send the reminder email
        await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: {
              name: "MyThriveBuddy",
              email: senderEmail,
            },
            to: [
              {
                email: action.user.email,
                name: action.user.name,
              },
            ],
            subject: emailSubject,
            htmlContent: emailBody,
          },
          {
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
            },
          }
        );
        
        console.log(`Reminder email sent for action ${action.id} to ${action.user.email}`);
        successCount++;
      } catch (emailError) {
        if (axios.isAxiosError(emailError)) {
          console.error(`Failed to send reminder email for action ${action.id}:`, emailError.message);
          console.error("Email error details:", emailError.response?.data);
        } else {
          console.error(`Failed to send reminder email for action ${action.id}:`, emailError);
        }
      }
    }
    
    return NextResponse.json({
      message: `Sent ${successCount} reminder emails out of ${upcomingActions.length} upcoming actions`,
      sentCount: successCount,
      totalCount: upcomingActions.length,
    });
  } catch (error) {
    console.error("Error sending reminder emails:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to send reminder emails";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 