// /api/challenge/(group_chat)/chat/react/route.ts
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { messageId, emoji, challengeId } = await req.json();
    const userId = session.user.id;

    // 1. Find ANY existing reaction by this user on this message
    const existing = await prisma.challengeMessageReaction.findUnique({
      where: {
        userId_messageId: { userId, messageId }, // Uses the new constraint
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // A. Clicked same emoji -> Remove it
        await prisma.challengeMessageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        // B. Clicked different emoji -> Swap it (Update)
        await prisma.challengeMessageReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      // C. No reaction yet -> Create
      await prisma.challengeMessageReaction.create({
        data: { userId, messageId, emoji },
      });
    }

    // 2. Get updated list for Realtime
    const updatedReactions = await prisma.challengeMessageReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true, user: { select: { name: true, image: true } } },
    });

    // 3. Broadcast update
    await supabaseAdmin.channel(`challenge-chat-${challengeId}`).send({
      type: "broadcast",
      event: "reaction_update",
      payload: { messageId, reactions: updatedReactions },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}