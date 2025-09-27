// File: app/api/user/reminders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// --- AuthOptions Definition ---
const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = user.id; } return token; },
    async session({ session, token }) { if (token && session.user) { session.user.id = token.id as string; } return session; },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

// GET all reminders for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

// POST a new reminder
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // --- FIX: Added Server-Side Input Validation ---
    if (!data.title || data.title.trim() === "") {
        return NextResponse.json({ error: "Reminder title cannot be empty." }, { status: 400 });
    }
    if (![30, 60].includes(data.frequency)) {
        return NextResponse.json({ error: "Invalid frequency. Must be 30 or 60 minutes." }, { status: 400 });
    }
    
    const newReminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        image: data.image,
      },
    });

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}

// PUT request to update a reminder
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, ...data } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
        }

        // --- FIX: Added Server-Side Input Validation ---
        if (!data.title || data.title.trim() === "") {
            return NextResponse.json({ error: "Reminder title cannot be empty." }, { status: 400 });
        }
        if (![30, 60].includes(data.frequency)) {
            return NextResponse.json({ error: "Invalid frequency. Must be 30 or 60 minutes." }, { status: 400 });
        }
        
        // --- FIX: Replaced update with updateMany for compound where clause ---
        const result = await prisma.reminder.updateMany({
            where: {
                id: id,
                userId: session.user.id, // Ensures user can only update their own reminders
            },
            data: {
                title: data.title,
                description: data.description,
                frequency: data.frequency,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                image: data.image,
            },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Reminder not found or you don't have permission to edit it." }, { status: 404 });
        }

        return NextResponse.json({ message: "Reminder updated successfully." });
    } catch (error) {
        console.error("Error updating reminder:", error);
        return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
    }
}

// DELETE request to remove a reminder
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
        }

        // --- FIX: Replaced delete with deleteMany for compound where clause ---
        const result = await prisma.reminder.deleteMany({
            where: {
                id: id,
                userId: session.user.id, // Ensures user can only delete their own reminders
            },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Reminder not found or you don't have permission to delete it." }, { status: 404 });
        }

        return NextResponse.json({ message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
    }
}
