import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeInngestSend } from "@/lib/utils/inngest/utils";
import { PaymentContextType } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  try {
    const session = await checkRole(
      "USER",
      undefined,
      "Please login to enroll",
    );
    const userId = session.user.id;

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: "Event ID required" },
        { status: 400 },
      );
    }

    // 1️⃣ Fetch event with ticket
    const event = await prisma.hostedEvent.findUnique({
      where: { id: eventId },
      include: {
        tickets: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // 2️⃣ Check event is published/active
    if (event.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Event is not active" },
        { status: 400 },
      );
    }

    // 3️⃣ Check free event
    if (event.isPaid) {
      return NextResponse.json(
        { message: "This is a paid event" },
        { status: 400 },
      );
    }

    // 4️⃣ Check ticket exists
    const ticket = event.tickets?.[0];

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not configured" },
        { status: 400 },
      );
    }

    // 5️⃣ Check capacity
    if (event._count.enrollments >= ticket.quantity) {
      return NextResponse.json({ message: "Event is full" }, { status: 400 });
    }

    // 6️⃣ Prevent duplicate enrollment
    const existing = await prisma.hostedEventEnrollment.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already enrolled" },
        { status: 400 },
      );
    }

    // 7️⃣ Create enrollment
    const enrollment = await prisma.hostedEventEnrollment.create({
      data: {
        userId,
        eventId,
        ticketId: ticket.id,
      },
    });

    await safeInngestSend({
      name: "mmp-challenge-store.notify",
      id: `notify-${event.id}-${userId}`,
      data: {
        userId: session.user.id,
        isFree: true, // free flow
        entityType: PaymentContextType.HOSTED_EVENT,
        entityId: event.id,
      },
    });
    return NextResponse.json(
      {
        message: "Enrolled successfully",
        enrollment,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 400 },
    );
  }
};
