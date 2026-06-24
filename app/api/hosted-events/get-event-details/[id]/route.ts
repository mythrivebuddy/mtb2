import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/hosted-event";
import { NextRequest, NextResponse } from "next/server";
import {
  HostedEventFormat,
  HostedEventResourceVisibility,
  HostedEventType,
  Status,
  SubscriptionPlanCurrency,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";



type RouteContext = { params: Promise<{ id: string }> };

 interface PublicEventAgendaSlot {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string | null;
  order: number;
}

 interface PublicEventTicket {
  id: string;
  price: number;
  quantity: number;
  currency: SubscriptionPlanCurrency | null;
  spotsLeft: number;
}

 interface PublicEventCreator {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  businessProfile: {
    tagline: string | null;
    yearsOfExperience: number | null;
    shortBio: string | null;
    profilePhoto: string | null;
  } | null;
}

 interface PublicEventDetail {
  id: string;
  title: string;
  description: string | null;
  type: HostedEventType;
  coverImage: string | null;
  format: HostedEventFormat | null;
  venueName: string | null;
  address: string | null;
  travelInstructions: string | null;
  meetingLink: string | null;
  startTime: string | null;
  endTime: string | null;
  timeZone: string | null;
  isPaid: boolean;
  resourcesVisibility: HostedEventResourceVisibility;
  resources?: string | null;
  status: Status;
  ticket: PublicEventTicket | null;
  agendaSlots: PublicEventAgendaSlot[];
  creator: PublicEventCreator;
  isEnrolled: boolean;
}

 type GetEventDetailResponse = {
  event: PublicEventDetail;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;
    const event = await prisma.hostedEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        coverImage: true,
        format: true,
        venueName: true,
        address: true,
        travelInstructions: true,
        meetingLink: true,
        startTime: true,
        endTime: true,
        timeZone: true,
        isPaid: true,
        resourcesVisibility: true,
        resources: true,
        status: true,
        tickets: {
          take: 1,
          select: {
            id: true,
            price: true,
            quantity: true,
            currency: true,
            _count: { select: { enrollments: true } },
          },
        },
        agendaSlots: {
          orderBy: [{ day: "asc" }, { order: "asc" }],
          select: {
            id: true,
            day: true,
            time: true,
            title: true,
            description: true,
            order: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            userBusinessProfile: {
              select: {
                tagline: true,
                yearsOfExperience: true,
                shortBio: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.hostedEventEnrollment.findUnique({
        where: {
          userId_eventId: {
            userId: userId,
            eventId: id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    const rawTicket = event.tickets[0] ?? null;
    const ticket: PublicEventTicket | null = rawTicket
      ? {
          id: rawTicket.id,
          price: rawTicket.price,
          quantity: rawTicket.quantity,
          currency: rawTicket.currency,
          spotsLeft: rawTicket.quantity - rawTicket._count.enrollments,
        }
      : null;

    const response: GetEventDetailResponse = {
      event: {
        ...event,
        startTime: event?.startTime?.toISOString() ?? null,
        endTime: event.endTime?.toISOString() ?? null,
        ticket,
        agendaSlots: event.agendaSlots,
        creator: {
          ...event.creator,
          businessProfile: event.creator.userBusinessProfile,
        },
        isEnrolled,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}