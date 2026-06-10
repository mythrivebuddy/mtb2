// /api/hosted-events/[id]/route.ts
import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
  parseHostedEventCreateBody,
  toHostedEventAgendaCreateManyData,
  toHostedEventUpdateData,
  validationError,
} from "@/lib/hosted-event";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { updateHostedEventSchema } from "@/schema/hosted-event";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await checkRole("USER");

    const { id } = await context.params;
    const event = await prisma.hostedEvent.findUnique({
      where: { id },
      include: hostedEventInclude,
    });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }
    const ticket = event.tickets?.[0] ?? null;
    return NextResponse.json({ event, ticket });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await checkRole("USER");
    const creatorId = session.user.id;
    const { id } = await context.params;

    const body = await parseHostedEventCreateBody(req, id);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = updateHostedEventSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const now = new Date();
    let shouldNotify = false;
    let actionType: "created" | "updated" = "created";

    const event = await prisma.$transaction(async (tx) => {
      const existing = await tx.hostedEvent.findUnique({
        where: { id },
        select: { id: true, creatorId: true, lastSubmittedAt: true },
      });

      if (!existing) return null;
      if (existing.creatorId !== creatorId) return "FORBIDDEN" as const;

      if (parsed.data.ticket !== undefined) {
        const enrollmentCount = await tx.hostedEventEnrollment.count({
          where: { eventId: id },
        });

        if (enrollmentCount > 0) return "HAS_ENROLLMENTS" as const;
      }

      if (parsed.data.status === "UNDER_REVIEW") {
        if (!existing?.lastSubmittedAt) {
          shouldNotify = true;
        } else if (
          now.getTime() - existing.lastSubmittedAt.getTime() >
          2 * 60 * 1000
        ) {
          shouldNotify = true;
          actionType = "updated";
        }
      }

      await tx.hostedEvent.update({
        where: { id },
        data: {
          ...toHostedEventUpdateData(parsed.data),
          // 🟢 2. ADD THIS SINGLE LINE
          ...(shouldNotify ? { lastSubmittedAt: now } : {}),
        },
      });

      if (parsed.data.ticket !== undefined) {
        const ticket = parsed.data.ticket;

        if (ticket) {
          await tx.hostedEventTicket.upsert({
            where: { eventId: id },
            update: {
              price: ticket.price,
              quantity: ticket.quantity,
              currency: ticket.currency,
            },
            create: {
              eventId: id,
              price: ticket.price,
              quantity: ticket.quantity,
              currency: ticket.currency,
            },
          });
        }
      }

      if (parsed.data.agendaSlots !== undefined) {
        await tx.hostedEventAgendaSlot.deleteMany({ where: { eventId: id } });

        if (parsed.data.agendaSlots.length > 0) {
          await tx.hostedEventAgendaSlot.createMany({
            data: toHostedEventAgendaCreateManyData(
              parsed.data.agendaSlots,
              id,
            ),
          });
        }
      }

      return tx.hostedEvent.findUniqueOrThrow({
        where: { id },
        include: hostedEventInclude,
      });
    });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }

    if (event === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    if (event === "HAS_ENROLLMENTS") {
      return NextResponse.json(
        { message: "Tickets cannot be replaced after enrollments exist." },
        { status: 409 },
      );
    }
    const ticket = event.tickets?.[0] ?? null;
    if (event.status === "UNDER_REVIEW") {
      await inngest.send({
        name: "notification/send",
        data: {
          types: ["HOSTED_EVENT_CREATED_ADMIN"],
          actorId: session.user.id,
          sendToUser: false,
          sendToAdmin: true,
          sendToCoach: false,
          sendEmailAdmin: true,
          adminEntityType: "HOSTED_EVENT",
          context: {
            userName: session.user.name,
            userId: session.user.id,
            hostedEventTitle: event.title,
            hostedEventId: event.id,
            hostedEventType: event.type, // e.g. "Online", "In-Person"
            amountSection: ticket?.price
              ? ` for ${ticket.currency ?? "₹"} ${ticket.price}`
              : undefined,
            currency: ticket?.currency ?? undefined,
            actionType,
          },
        },
      });
    }

    return NextResponse.json({
      event: { ...event, tickets: undefined },
      ticket,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await checkRole("USER");
    const creatorId = session.user.id;
    const { id } = await context.params;

    const event = await prisma.hostedEvent.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }

    if (event.creatorId !== creatorId) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    if (event._count.enrollments > 0) {
      return NextResponse.json(
        { message: "Cannot delete an event with enrollments." },
        { status: 409 },
      );
    }

    await prisma.hostedEvent.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}
