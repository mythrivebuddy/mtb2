import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
  parseJson,
  toHostedEventAgendaCreateManyData,
  toHostedEventTicketCreateManyData,
  toHostedEventUpdateData,
  validationError,
} from "@/lib/hosted-event";
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

    return NextResponse.json({ event });
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

    const body = await parseJson(req);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = updateHostedEventSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const event = await prisma.$transaction(async (tx) => {
      const existing = await tx.hostedEvent.findUnique({
        where: { id },
        select: { id: true, creatorId: true },
      });

      if (!existing) return null;
      if (existing.creatorId !== creatorId) return "FORBIDDEN" as const;

      if (parsed.data.tickets !== undefined) {
        const enrollmentCount = await tx.hostedEventEnrollment.count({
          where: { eventId: id },
        });

        if (enrollmentCount > 0) return "HAS_ENROLLMENTS" as const;
      }

      await tx.hostedEvent.update({
        where: { id },
        data: toHostedEventUpdateData(parsed.data),
      });

      if (parsed.data.tickets !== undefined) {
        await tx.hostedEventTicket.deleteMany({ where: { eventId: id } });

        if (parsed.data.tickets.length > 0) {
          await tx.hostedEventTicket.createMany({
            data: toHostedEventTicketCreateManyData(parsed.data.tickets, id),
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

    return NextResponse.json({ event });
  } catch (error) {
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
