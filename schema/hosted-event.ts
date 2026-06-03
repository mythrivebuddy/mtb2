import {
  HostedEventFormat,
  HostedEventResourceVisibility,
  HostedEventType,
  Status,
  SubscriptionPlanCurrency,
} from "@prisma/client";
import { z } from "zod";

const dateSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date());

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const hostedEventTicketSchema = z.object({
   id: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  currency: z.nativeEnum(SubscriptionPlanCurrency),

});

export const hostedEventAgendaSlotSchema = z.object({
    id: z.string().optional(),
  day: z.number().int().positive(),
  time: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(150),
  description: optionalStringSchema,
  order: z.number().int().nonnegative(),
});

const hostedEventBaseSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: optionalStringSchema,
  type: z.nativeEnum(HostedEventType),
  categoryId: z.number().int().positive().optional().nullable(),
  customCategory: optionalStringSchema,
  coverImage: optionalStringSchema,
  format: z.nativeEnum(HostedEventFormat),
  venueName: optionalStringSchema,
  address: optionalStringSchema,
  travelInstructions: optionalStringSchema,
  meetingLink: optionalStringSchema,
  meetingPlatform: optionalStringSchema,
  startTime: dateSchema,
  endTime: dateSchema.optional().nullable(),
  timezone: optionalStringSchema,
  isPaid: z.boolean(),
  resources: optionalStringSchema,
  resourcesVisibility: z
    .nativeEnum(HostedEventResourceVisibility)
    .default(HostedEventResourceVisibility.PUBLIC),
  status: z.nativeEnum(Status).default(Status.DRAFT),
});

type HostedEventPayload = Partial<z.infer<typeof hostedEventBaseSchema>> & {
  ticket?: HostedEventTicketInput | null;
  agendaSlots?: HostedEventAgendaSlotInput[];
};

export const createHostedEventSchema = hostedEventBaseSchema
  .extend({
    ticket: hostedEventTicketSchema.optional().nullable(),
    agendaSlots: z.array(hostedEventAgendaSlotSchema).optional().default([]),
  })
  .superRefine(validateHostedEventPayload);

export const updateHostedEventSchema = hostedEventBaseSchema
  .partial()
  .extend({
    ticket: hostedEventTicketSchema.optional().nullable(),
    agendaSlots: z.array(hostedEventAgendaSlotSchema).optional(),
  })
  .superRefine(validateHostedEventPayload);

export const adminHostedEventStatusSchema = z
  .object({
    status: z.enum([Status.PUBLISHED, Status.UNDER_REVIEW]).optional(),
    action: z.enum(["approve", "disapprove"]).optional(),
  })
  .refine((value) => value.status || value.action, {
    message: "Either status or action is required.",
  });

export type CreateHostedEventInput = z.infer<typeof createHostedEventSchema>;
export type UpdateHostedEventInput = z.infer<typeof updateHostedEventSchema>;
export type HostedEventTicketInput = z.infer<typeof hostedEventTicketSchema>;
export type HostedEventAgendaSlotInput = z.infer<
  typeof hostedEventAgendaSlotSchema
>;

function validateHostedEventPayload(
  input: HostedEventPayload,
  ctx: z.RefinementCtx,
) {


  if (input.format === HostedEventFormat.IN_PERSON && (!input.venueName || !input.address)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["location"],
      message: "location is required for in-person events.",
    });
  }

  if (input.format === HostedEventFormat.ONLINE && !input.meetingLink) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingLink"],
      message: "meetingLink is required for online events.",
    });
  }



  if (input.isPaid === true) {
    if (!input.ticket) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ticket"],
        message: "Ticket is required for paid events.",
      });
    } else {
      if (input.ticket.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ticket", "price"],
          message: "Price must be greater than 0.",
        });
      }
    }
  }

  // ✅ Free event → price must be 0
  if (input.isPaid === false && input.ticket) {
    if (input.ticket.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ticket", "price"],
        message: "Free events must have price = 0.",
      });
    }
  }

  if (input.agendaSlots) {
    const orderKeys = new Set<string>();

    input.agendaSlots.forEach((slot, index) => {
      const key = `${slot.day}:${slot.order}`;

      if (orderKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["agendaSlots", index, "order"],
          message: "Agenda slot order must be unique within each day.",
        });
      }

      orderKeys.add(key);
    });
  }
}
