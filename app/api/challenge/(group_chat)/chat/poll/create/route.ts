// /api/challenge/(group_chat)/chat/poll/create/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "../../../../../auth/[...nextauth]/auth.config";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { challengeId, question, options, allowMultiple } = await req.json();

    if (!challengeId || !question || !options || options.length < 2) {
      return NextResponse.json({ error: "Invalid poll data" }, { status: 400 });
    }

    // 1. Transaction: Create Message -> Poll -> Options
    const newMessage = await prisma.challengeMessage.create({
      data: {
        userId: session.user.id,
        challengeId,
        // message can be null/undefined now
        poll: {
          create: {
            question,
            allowMultiple,
            options: {
              create: options.map((opt: string) => ({ text: opt })),
            },
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        poll: {
          include: {
            options: {
              include: { votes: { select: { userId: true } } }
            }
          }
        }
      },
    });

    // 2. Broadcast
    await supabaseAdmin.channel(`challenge-chat-${challengeId}`).send({
      type: "broadcast",
      event: "new_message",
      payload: newMessage,
    });

    return NextResponse.json(newMessage);
  } catch (err) {
    console.error("Error creating poll:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}