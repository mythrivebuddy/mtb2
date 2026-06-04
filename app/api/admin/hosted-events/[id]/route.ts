import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
  parseJson,
  validationError,
} from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { adminHostedEventStatusSchema } from "@/schema/hosted-event";
import { Status } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await checkRole("ADMIN");

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

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await checkRole("ADMIN");

    const body = await parseJson(req);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = adminHostedEventStatusSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { id } = await context.params;
    const status =
      parsed.data.status ??
      (parsed.data.action === "approve"
        ? Status.PUBLISHED
        : Status.UNDER_REVIEW);

    const event = await prisma.hostedEvent.update({
      where: { id },
      data: { status },
      include: hostedEventInclude,
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await checkRole("ADMIN");

    const { id } = await context.params;

    await prisma.$transaction(async (tx) => {
      await tx.hostedEventEnrollment.deleteMany({ where: { eventId: id } });
      await tx.hostedEventAgendaSlot.deleteMany({ where: { eventId: id } });
      await tx.hostedEventTicket.deleteMany({ where: { eventId: id } });
      await tx.hostedEvent.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Event force deleted." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}
