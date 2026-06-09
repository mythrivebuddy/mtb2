import { authErrorResponse, errorResponse } from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { HostedEventType, Status } from "@prisma/client";
import handleSupabaseImageUploadWithSharp from "@/lib/utils/supabase-image-upload-with-sharp";

interface ParsedTicket {
  price: number;
  quantity: number;
  currency: "INR" | "USD" | null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole(["USER", "ADMIN"]);
    const creatorId = session.user.id;

    const formData = await req.formData();

    const eventId = formData.get("eventId") as string | null;

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as HostedEventType;
    const isPaid = formData.get("isPaid") === "true";

    const coverImageFile = formData.get("coverImage") as File | null;

    let event;

    // =========================================================
    // 🔥 CREATE OR UPDATE EVENT
    // =========================================================
    if (eventId) {
      event = await prisma.hostedEvent.update({
        where: { id: eventId },
        data: {
          title,
          description,
          type,
          isPaid,
          status: Status.DRAFT,
        },
      });
    } else {
      event = await prisma.hostedEvent.create({
        data: {
          creatorId,
          title: title || "Untitled Event",
          description: description || null,
          type: type || HostedEventType.WORKSHOP,
          isPaid: isPaid ?? false,
          startTime: new Date(),
          status: Status.DRAFT,
        },
      });
    }

    // =========================================================
    // 🔥 IMAGE UPLOAD (ONLY IF NEW FILE)
    // =========================================================
    if (coverImageFile && coverImageFile.size > 0) {
      const imageUrl = await handleSupabaseImageUploadWithSharp(
        coverImageFile,
        "events",
        event.id,
        {
          fileName: "coverImage",
          width: 400,
          height: 300,
          quality: 70,
        },
      );
      event = await prisma.hostedEvent.update({
        where: { id: event.id },
        data: { coverImage: imageUrl },
      });
    }

    // =========================================================
    // 🔥 SINGLE TICKET UPSERT
    // =========================================================
    const ticketString = formData.get("ticket") as string | null;
    let ticket = null;

    if (ticketString) {
      const ticketObj: ParsedTicket = JSON.parse(ticketString);

      ticket = await prisma.hostedEventTicket.upsert({
        where: {
          eventId: event.id, // requires @unique
        },
        update: {
          price: ticketObj.price,
          quantity: ticketObj.quantity,
          currency: ticketObj.currency,
        },
        create: {
          eventId: event.id,
          price: ticketObj.price,
          quantity: ticketObj.quantity,
          currency: ticketObj.currency,
        },
      });
    }

    return NextResponse.json({ event, ticket }, { status: 201 });
  } catch (error) {
    console.log("❌ Error in POST /api/hosted-events/draft:", error);

    if (error instanceof Error && error.message.includes("authorized")) {
      return authErrorResponse(error);
    }

    return errorResponse(error);
  }
}
