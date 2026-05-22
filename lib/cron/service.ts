import type { CronKey } from "@prisma/client";

import { CRON_KEYS } from "@/lib/cron/constants";
import { prisma } from "@/lib/prisma";

export type CronScheduleDTO = {
  id: string | null;
  key: CronKey;
  hour: number;
  minute: number;
  updatedAt: Date | null;
};

const DEFAULT_CRON_TIME = {
  hour: 0,
  minute: 0,
} as const;

export async function listCronSchedules(): Promise<CronScheduleDTO[]> {
  const schedules = await prisma.cronSchedule.findMany();
  const schedulesByKey = new Map(schedules.map((schedule) => [schedule.key, schedule]));

  return CRON_KEYS.map((key) => {
    const schedule = schedulesByKey.get(key as CronKey);

    return {
      id: schedule?.id ?? null,
      key: key as CronKey,
      hour: schedule?.hour ?? DEFAULT_CRON_TIME.hour,
      minute: schedule?.minute ?? DEFAULT_CRON_TIME.minute,
      updatedAt: schedule?.updatedAt ?? null,
    };
  });
}

export async function createCronSchedule(data: {
  key: CronKey;
  hour: number;
  minute: number;
}) {
  return prisma.cronSchedule.create({
    data,
  });
}

export async function updateCronSchedule(
  key: CronKey,
  data: {
    hour: number;
    minute: number;
  }
) {
  return prisma.cronSchedule.upsert({
    where: { key },
    create: {
      key,
      ...data,
    },
    update: data,
  });
}
