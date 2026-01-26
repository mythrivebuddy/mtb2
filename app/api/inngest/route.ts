import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { onboardingReminder } from "@/app/inngest/onboarding/onboarding-reminders";
// import { dailyReminderCron } from "@/app/inngest/daily/daily-primary-reminder";
// import { dailyReminderCheck } from "@/app/inngest/daily/daily-reminder-check";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    onboardingReminder,
    // dailyReminderCron,     //  cron-based
    // dailyReminderCheck, //event-based
  ],
});
