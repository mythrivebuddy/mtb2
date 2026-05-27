import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload";
import type {
  CreateHostedEventInput,
  HostedEventAgendaSlotInput,
  HostedEventTicketInput,
  UpdateHostedEventInput,
} from "@/schema/hosted-event";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RESOURCE_MAX_SIZE = 25 * 1024 * 1024;
const RESOURCE_EXTENSIONS = ["pdf", "docx", "key"];

export const hostedEventInclude = {
  tickets: {
    orderBy: { createdAt: "asc" },
  },
  agendaSlots: {
    orderBy: [{ day: "asc" }, { order: "asc" }],
  },
  creator: {
    select: { id: true, name: true, email: true, image: true },
  },
} satisfies Prisma.HostedEventInclude;

export async function parseJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function parseHostedEventCreateBody(
  req: NextRequest,
  creatorId: string,
) {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return parseJson(req);
  }

  const formData = await req.formData();
  const body = readHostedEventFormBody(formData);
  const coverImage = formData.get("coverImage");
  const resources = formData.get("resources") ?? formData.get("resource");

  if (isUploadedFile(coverImage)) {
    if (!coverImage.type.startsWith("image/")) {
      throw new Error("coverImage must be an image file.");
    }

    body.coverImage = await handleSupabaseImageUpload(
      coverImage,
      "hosted-events",
      `${creatorId}/cover-images`,
    );
  }

  if (isUploadedFile(resources)) {
    validateResourceFile(resources);

    body.resources = await handleSupabaseImageUpload(
      resources,
      "hosted-events",
      `${creatorId}/resources`,
    );
  }

  return body;
}

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { message: "Validation failed.", errors: error.flatten().fieldErrors },
    { status: 422 },
  );
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  const status = message === "Unauthorized" ? 401 : 403;

  return NextResponse.json({ message }, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A record with the same unique fields already exists." },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { message: "Invalid related record reference." },
        { status: 400 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { message: "Invalid JSON field in form data." },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const isUploadValidationError =
      error.message.includes("coverImage") ||
      error.message.includes("resources") ||
      error.message.includes("Resource");

    if (isUploadValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { message: "Something went wrong." },
    { status: 500 },
  );
}

export function toHostedEventCreateData(
  input: CreateHostedEventInput,
  creatorId: string,
): Prisma.HostedEventCreateInput {
  return {
    title: input.title,
    description: input.description,
    type: input.type,
    category: input.categoryId
      ? { connect: { id: input.categoryId } }
      : undefined,
    customCategory: input.customCategory,
    coverImage: input.coverImage,
    format: input.format,
    location: input.location,
    meetingLink: input.meetingLink,
    meetingPlatform: input.meetingPlatform,
    startTime: input.startTime,
    endTime: input.endTime ?? null,
    isPaid: input.isPaid,
    resources: input.resources,
    resourcesVisibility: input.resourcesVisibility,
    status: input.status,
    creator: { connect: { id: creatorId } },
  };
}

export function toHostedEventUpdateData(
  input: UpdateHostedEventInput,
): Prisma.HostedEventUpdateInput {
  const data: Prisma.HostedEventUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.customCategory !== undefined)
    data.customCategory = input.customCategory;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.format !== undefined) data.format = input.format;
  if (input.location !== undefined) data.location = input.location;
  if (input.meetingLink !== undefined) data.meetingLink = input.meetingLink;
  if (input.meetingPlatform !== undefined) {
    data.meetingPlatform = input.meetingPlatform;
  }
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;
  if (input.isPaid !== undefined) data.isPaid = input.isPaid;
  if (input.resources !== undefined) data.resources = input.resources;
  if (input.resourcesVisibility !== undefined) {
    data.resourcesVisibility = input.resourcesVisibility;
  }
  if (input.status !== undefined) data.status = input.status;

  return data;
}

export function toHostedEventTicketCreateManyData(
  tickets: HostedEventTicketInput[],
  eventId: string,
): Prisma.HostedEventTicketCreateManyInput[] {
  return tickets.map((ticket) => ({
    eventId,
    name: ticket.name,
    price: ticket.price,
    quantity: ticket.quantity,
    currency: ticket.currency,
    expiryDate: ticket.expiryDate ?? null,
    includeTax: ticket.includeTax,
  }));
}

export function toHostedEventAgendaCreateManyData(
  agendaSlots: HostedEventAgendaSlotInput[],
  eventId: string,
): Prisma.HostedEventAgendaSlotCreateManyInput[] {
  return agendaSlots.map((slot) => ({
    eventId,
    day: slot.day,
    time: slot.time,
    title: slot.title,
    description: slot.description,
    order: slot.order,
  }));
}

function readHostedEventFormBody(formData: FormData) {
  const data = formData.get("data") ?? formData.get("event");

  if (typeof data === "string" && data.trim()) {
    return JSON.parse(data);
  }

  return {
    title: formData.get("title"),
    description: emptyToNull(formData.get("description")),
    type: formData.get("type"),
    categoryId: toNumberOrNull(formData.get("categoryId")),
    customCategory: emptyToNull(formData.get("customCategory")),
    coverImage: emptyToNull(formData.get("coverImage")),
    format: formData.get("format"),
    location: emptyToNull(formData.get("location")),
    meetingLink: emptyToNull(formData.get("meetingLink")),
    meetingPlatform: emptyToNull(formData.get("meetingPlatform")),
    startTime: formData.get("startTime"),
    endTime: emptyToNull(formData.get("endTime")),
    isPaid: toBoolean(formData.get("isPaid")),
    resources: emptyToNull(formData.get("resources")),
    resourcesVisibility: emptyToUndefined(formData.get("resourcesVisibility")),
    status: emptyToUndefined(formData.get("status")),
    tickets: parseJsonField(formData.get("tickets"), []),
    agendaSlots: parseJsonField(formData.get("agendaSlots"), []),
  };
}

function validateResourceFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (file.size > RESOURCE_MAX_SIZE) {
    throw new Error("Resource file must be 25 MB or smaller.");
  }

  if (!extension || !RESOURCE_EXTENSIONS.includes(extension)) {
    throw new Error("Resource file must be a PDF, DOCX, or Keynote file.");
  }
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function parseJsonField(value: FormDataEntryValue | null, fallback: unknown) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return JSON.parse(value);
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

function toNumberOrNull(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number(value);
}

function emptyToNull(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  return value.trim() ? value : null;
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value : undefined;
}
