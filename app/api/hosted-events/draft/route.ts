import { authErrorResponse, errorResponse } from "@/lib/hosted-event";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { HostedEventType, Status } from "@prisma/client";
import handleSupabaseImageUploadWithSharp from "@/lib/utils/supabase-image-upload-with-sharp";
import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import {
  checkFeature,
  checkFeatureAction,
} from "@/lib/access-control/checkFeature";
import { LimitType } from "@/lib/access-control/featureConfig";
import { getLimitPeriodStart } from "@/lib/access-control/limitPeriod";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { handleSupabaseFileReplace } from "@/lib/utils/supabase-image-upload";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ParsedTicket {
  price: number;
  quantity: number;
  currency: "INR" | "USD" | null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole(["USER", "ADMIN"]);
    const creatorId = session.user.id;
    const normalizedUserType = normalizeUserType(session.user.userType);

    const featureResult = await checkFeature({
      feature: "hostedEvents", // 👈 use whatever key matches your featureConfig
      user: {
        userType: normalizedUserType ?? undefined,
        membership: session.user.membership ?? undefined,
      },
    });

    if (!featureResult.allowed) {
      return NextResponse.json(
        { message: featureResult.reason },
        { status: 403 },
      );
    }

    const canCreate = checkFeatureAction({
      feature: featureResult.feature!,
      action: "create",
      userType: normalizedUserType ?? undefined,
    });

    if (!canCreate) {
      return NextResponse.json(
        {
          message: "You are not allowed to create events.",
          isUpgradeFlagShow: false,
        },
        { status: 403 },
      );
    }
    const formData = await req.formData();

    const eventId = formData.get("eventId") as string | null;

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as HostedEventType;
    const isPaid = formData.get("isPaid") === "true";

    const coverImageFile = formData.get("coverImage") as File | null;

    const resourceFile =
      (formData.get("resources") as File) || (formData.get("resource") as File);

    if (resourceFile && resourceFile.size > 0) {
      const ext = resourceFile.name.split(".").pop()?.toLowerCase();

      if (resourceFile.size > 25 * 1024 * 1024) {
        throw new Error("File must be under 25MB");
      }

      if (!["pdf", "docx", "key"].includes(ext || "")) {
        throw new Error("Invalid file type");
      }
    }

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
      const planConfig = featureResult.config as {
        createLimit: number;
        isUpgradeFlagShow?: boolean;
        limitType: LimitType;
        canCreatePaidEvents?: boolean;
      };

      const { createLimit, isUpgradeFlagShow, limitType } = planConfig;
      const periodStart = getLimitPeriodStart(limitType);

      const createdCount = await prisma.hostedEvent.count({
        where: {
          creatorId,
          ...(periodStart && { createdAt: { gte: periodStart } }),
        },
      });

      const limitResponse = await enforceLimitResponse({
        limit: createLimit,
        currentCount: createdCount,
        message:
          createLimit === 0
            ? `You cannot create events on your current plan.${isUpgradeFlagShow ? " Please upgrade." : ""}`
            : `You have reached your limit of ${createLimit}  event${createLimit === 1 ? "" : "s"}.${isUpgradeFlagShow ? " Please upgrade." : ""}`,
      });

      if (limitResponse) return limitResponse;
      if (isPaid && !planConfig.canCreatePaidEvents) {
        return NextResponse.json(
          {
            message:
              "Your current plan doesn't support paid events. Upgrade your plan to create them.",
            isUpgradeFlagShow: planConfig.isUpgradeFlagShow ?? true,
          },
          { status: 403 },
        );
      }
      event = await prisma.hostedEvent.create({
        data: {
          creatorId,
          title: title || "Untitled Event",
          description: description || null,
          type: type || HostedEventType.WORKSHOP,
          isPaid: isPaid ?? false,
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
    // 🔥 RESOURCE UPLOAD
    // =========================================================
    let resourceUrl: string | null = null;

    if (resourceFile && resourceFile.size > 0) {
      resourceUrl = await handleSupabaseFileReplace({
        file: resourceFile,
        bucket: "events",
        folder: event.id,
        fileName: "resource.pdf",
        upsert: true,
      });

      event = await prisma.hostedEvent.update({
        where: { id: event.id },
        data: {
          resources: resourceUrl,
        },
      });
    }
    const clearResources = formData.get("clearResources");

    if (clearResources === "true") {
      // 🔥 direct path (no parsing needed)
      const filePath = `${event.id}/resource.pdf`;

      await supabaseAdmin.storage.from("events").remove([filePath]);

      event = await prisma.hostedEvent.update({
        where: { id: event.id },
        data: {
          resources: null,
        },
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
