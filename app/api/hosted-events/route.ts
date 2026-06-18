// /api/hosted-events/route.ts
import { authOptions } from "@/lib/auth";
import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
  parseHostedEventCreateBody,
  toHostedEventAgendaCreateManyData,
  toHostedEventCreateData,
  validationError,
} from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { createHostedEventSchema } from "@/schema/hosted-event";
import { Status } from "@prisma/client";
import { getServerSession } from "next-auth";
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

      // if (parsed.data.ticket) {
      //   await tx.hostedEventTicket.createMany({
      //     data: toHostedEventTicketCreateManyData(
      //       parsed.data.tickets,
      //       createdEvent.id,
      //     ),
      //   });
      // }

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    const includePast = searchParams.get("past") === "true";
    const search = searchParams.get("search")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";

    const now = new Date();

    const events = await prisma.hostedEvent.findMany({
 where: {
    status: Status.PUBLISHED,
    ...(!includePast && { startTime: { gt: now } }),
  ...(search
  ? {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { creator: { name: { contains: search, mode: "insensitive" as const } } },
        { venueName: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
      ],
    }
  : location
  ? {
      OR: [
        { venueName: { contains: location, mode: "insensitive" as const } },
        { address: { contains: location, mode: "insensitive" as const } },
      ],
    }
  : {}),
  },
      include: {
        ...hostedEventInclude,
        ...(userId && {
          enrollments: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedEvents = events.map((event) => {
      const typedEvent = event as typeof event & {
        enrollments?: { id: string }[];
      };
      const { enrollments, ...rest } = typedEvent;
      return {
        ...rest,
        isEnrolled: enrollments ? enrollments.length > 0 : false,
      };
    });

    // Split into upcoming and past on the server
    const upcomingEvents = formattedEvents.filter(
      (e) => !e.startTime || new Date(e.startTime) > now,
    );
    const pastEvents = includePast
      ? formattedEvents.filter(
          (e) => e.startTime && new Date(e.startTime) <= now,
        )
      : [];

    return NextResponse.json({ events: upcomingEvents, pastEvents });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }
    return errorResponse(error);
  }
}