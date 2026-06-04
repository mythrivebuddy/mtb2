import {
  authErrorResponse,
  errorResponse,
  hostedEventInclude,
} from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { Status } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, context: RouteContext) {
  try {
    await checkRole("ADMIN");

    const { id } = await context.params;
    const event = await prisma.hostedEvent.update({
      where: { id },
      data: { status: Status.UNDER_REVIEW },
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
