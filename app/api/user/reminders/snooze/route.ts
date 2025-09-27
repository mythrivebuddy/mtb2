// File: app/api/user/reminders/snooze/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// --- Define authOptions directly in this file, matching your project's pattern ---
const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// PATCH request to snooze a reminder
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
        }

        // Snoozing works by updating the 'lastNotifiedAt' timestamp to the current time.
        // This resets the clock for the cron job, which will not send another notification
        // until the 'frequency' (30 or 60 mins) has passed.
        const snoozedReminder = await prisma.reminder.update({
            where: {
                id: id,
                userId: session.user.id, // Ensure user can only update their own reminders
            },
            data: {
                lastNotifiedAt: new Date(),
            },
        });

        return NextResponse.json(snoozedReminder);
    } catch (error) {
        console.error("Error snoozing reminder:", error);
        return NextResponse.json({ error: "Failed to snooze reminder" }, { status: 500 });
    }
}