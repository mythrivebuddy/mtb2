import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { onboardingReminder } from "@/app/inngest/onboarding/onboarding-reminders";
import { alignedActionReminders } from "@/app/inngest/aligned-action/aligned-action-reminders";
import { alignedActionSnooze } from "@/app/inngest/aligned-action/aligned-action-snooze";
import { sendInvoiceFunction } from "@/app/inngest/invoice/send-invoice";
import { mmpProgramReminder } from "@/app/inngest/mmp-reminder/mmpReminder";
import { notifyStakeholders } from "@/app/inngest/mmp-challenge-store-notify/notify";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    onboardingReminder,
    // dailyReminderCron,     //  cron-based
    // dailyReminderCheck, //event-based
    alignedActionReminders,
    alignedActionSnooze,
    sendInvoiceFunction,
    mmpProgramReminder,
    notifyStakeholders
  ],
});
