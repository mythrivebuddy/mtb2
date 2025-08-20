// File: app/api/user/reminders/route.ts

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
    
    const newReminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        frequency: data.frequency, // Expecting frequency in minutes from the frontend
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

        const updatedReminder = await prisma.reminder.update({
            where: {
                id: id,
                userId: session.user.id,
            },
            data: {
                title: data.title,
                description: data.description,
                frequency: data.frequency, // Expecting frequency in minutes from the frontend
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                image: data.image,
            },
        });

        return NextResponse.json(updatedReminder);
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

        await prisma.reminder.delete({
            where: {
                id: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
    }
}
