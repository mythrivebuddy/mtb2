// /api/challenge/(group_chat)/chat/poll/vote/route.ts
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
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { pollId, optionId, challengeId } = await req.json();
    const userId = session.user.id;

    // 1. Get Poll Settings (Note: Using ChallengeMessagePoll)
    const poll = await prisma.challengeMessagePoll.findUnique({
      where: { id: pollId },
      include: { options: { include: { votes: true } } }
    });

    if (!poll) return new NextResponse("Poll not found", { status: 404 });

    // 2. Check if user already voted for THIS specific option
    const existingVote = await prisma.challengeMessagePollVote.findUnique({
      where: { userId_optionId: { userId, optionId } }
    });

    if (existingVote) {
      // A. Toggle OFF (Remove vote)
      await prisma.challengeMessagePollVote.delete({ where: { id: existingVote.id } });
    } else {
      // B. Toggle ON (Add vote)
      
      // If NOT allow multiple, remove all other votes by this user for this poll first
      if (!poll.allowMultiple) {
        const optionIds = poll.options.map(o => o.id);
        await prisma.challengeMessagePollVote.deleteMany({
          where: {
            userId,
            optionId: { in: optionIds }
          }
        });
      }

      await prisma.challengeMessagePollVote.create({
        data: { userId, optionId }
      });
    }

    // 3. Get fresh poll data for broadcast
    const updatedPoll = await prisma.challengeMessagePoll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: { select: { userId: true, user: { select: { name: true, image: true } } } }
          }
        }
      }
    });

    // 4. Broadcast Update
    await supabaseAdmin.channel(`challenge-chat-${challengeId}`).send({
      type: "broadcast",
      event: "poll_update",
      payload: { messageId: poll.messageId, poll: updatedPoll },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}