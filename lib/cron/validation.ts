import { z } from "zod";

import { CRON_KEYS } from "@/lib/cron/constants";

const hourSchema = z.coerce
  .number()
  .int("Hour must be a whole number")
  .min(0, "Hour must be between 0 and 23")
  .max(23, "Hour must be between 0 and 23");

const minuteSchema = z.coerce
  .number()
  .int("Minute must be a whole number")
  .min(0, "Minute must be between 0 and 59")
  .max(59, "Minute must be between 0 and 59");

export const cronKeySchema = z.enum(CRON_KEYS);

export const cronScheduleCreateSchema = z.object({
  key: cronKeySchema,
  hour: hourSchema,
  minute: minuteSchema,
});

export const cronScheduleUpdateSchema = z.object({
  hour: hourSchema,
  minute: minuteSchema,
});

export type CronScheduleCreateInput = z.infer<typeof cronScheduleCreateSchema>;
export type CronScheduleUpdateInput = z.infer<typeof cronScheduleUpdateSchema>;
