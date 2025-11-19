// app/api/challenge/chat/send/route.ts
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Create an Admin Supabase client

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId, message } = await req.json();

    if (!challengeId || !message?.trim()) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 2. Create the message just as before
    const newMessage = await prisma.challengeMessage.create({
      data: {
        message,
        challengeId,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // 3. ✨ BROADCAST THE NEW MESSAGE
    // Use the admin client to send the full message object
    const channel = supabaseAdmin.channel(`challenge-chat-${challengeId}`);
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: newMessage, // Send the full message with user data
    });

    // 4. Return the new message to the sender
    return NextResponse.json(newMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}