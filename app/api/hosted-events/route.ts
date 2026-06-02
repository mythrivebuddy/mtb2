// /api/hosted-events/route.ts
import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
  parseHostedEventCreateBody,
  toHostedEventAgendaCreateManyData,
  toHostedEventCreateData,
  toHostedEventTicketCreateManyData,
  validationError,
} from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { createHostedEventSchema } from "@/schema/hosted-event";
import { Status } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const session = await checkRole(["USER", "ADMIN"]);
    const creatorId = session.user.id;
    const body = await parseHostedEventCreateBody(req, creatorId);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = createHostedEventSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.hostedEvent.create({
        data: toHostedEventCreateData(parsed.data, creatorId),
        select: { id: true },
      });

      if (parsed.data.tickets.length > 0) {
        await tx.hostedEventTicket.createMany({
          data: toHostedEventTicketCreateManyData(
            parsed.data.tickets,
            createdEvent.id,
          ),
        });
      }

      if (parsed.data.agendaSlots.length > 0) {
        await tx.hostedEventAgendaSlot.createMany({
          data: toHostedEventAgendaCreateManyData(
            parsed.data.agendaSlots,
            createdEvent.id,
          ),
        });
      }

      return tx.hostedEvent.findUniqueOrThrow({
        where: { id: createdEvent.id },
        include: hostedEventInclude,
      });
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}

export async function GET() {
  try {
    await checkRole(["USER", "ADMIN"]);

    const events = await prisma.hostedEvent.findMany({
      where: {
        status: Status.PUBLISHED,
        startTime: { gt: new Date() },
      },
      include: hostedEventInclude,
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}
