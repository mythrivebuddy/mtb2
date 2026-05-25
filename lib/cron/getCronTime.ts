import type { CronKey } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CronTime = {
  hour: number;
  minute: number;
};

export async function getCronTime(key: CronKey): Promise<CronTime> {
  const schedule = await prisma.cronSchedule.findUnique({
    where: { key },
    select: {
      hour: true,
      minute: true,
    },
  });

  return {
    hour: schedule?.hour ?? 0,
    minute: schedule?.minute ?? 0,
  };
}
export async function getAllCronTimes() {
  const schedules = await prisma.cronSchedule.findMany();

  return new Map(
    schedules.map((s) => [
      s.key,
      { hour: s.hour, minute: s.minute },
    ])
  );
}
