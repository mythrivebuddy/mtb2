export const CRON_KEYS = [
  "CMP_PRIMARY_REMINDER",
  "CMP_NUDGE_REMINDER",
  "CMP_SUNDAY_MORNING",
  "CMP_SUNDAY_EVENING",
  "DAILY_CHALLENGE_PENALTY",
  "CMP_INACTIVITY_7_DAY",
  "CMP_INACTIVITY_3_DAY",
  "DAILY_CHALLENGE_REMINDER",
] as const;

export type CronScheduleKey = (typeof CRON_KEYS)[number];

export function isCronScheduleKey(value: string): value is CronScheduleKey {
  return CRON_KEYS.includes(value as CronScheduleKey);
}

export function formatCronKeyLabel(key: CronScheduleKey) {
  return key
    .replace(/^CMP_/, "")
    .replace(/^DAILY_CHALLENGE_/, "DAILY_CHALLENGE_")
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatCronTimePreview(hour: number, minute: number) {
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return "Enter a valid time";
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return `Runs at ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} (user local time)`;
}
