// import { inngest } from "@/lib/inngest";
// import { prisma } from "@/lib/prisma";
// import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";

// export const dailyReminderCheck = inngest.createFunction(
//   { id: "daily-reminder-check" },
//   { event: "daily.reminder.check" },

//   async ({ event, step }) => {
//     const { userId } = event.data;
//     const isTestMode = process.env.INNGEST_TEST_MODE === "true";

//     const istStart = getISTStartOfDay();
//     const istEnd = getISTEndOfDay();

//     if (istStart.getDay() === 0) return;

//     /* ---------------- COMPLETION CHECK (REUSABLE) ---------------- */

//     const hasCompletedToday = async () => {
//       const entry = await prisma.makeoverProgressLog.findFirst({
//         where: {
//           userId,
//           date: {
//             gte: istStart,
//             lt: istEnd,
//           },
//         },
//         select: { id: true },
//       });
//       return !!entry;
//     };

//     // Initial hard stop
//     if (await step.run("check-completed-initial", hasCompletedToday)) {
//       return;
//     }

//     /* ---------------- CLAIM REMINDER WORKFLOW ---------------- */

//     const claim = await step.run("claim-reminder-slot", async () => {
//       return prisma.userProgramState.updateMany({
//         where: {
//           userId,
//           OR: [
//             { lastReminderDate: null },
//             { lastReminderDate: { lt: istStart } },
//           ],
//         },
//         data: { lastReminderDate: new Date() },
//       });
//     });

//     if (claim.count === 0) return;

//     /* ---------------- PRIMARY REMINDER ---------------- */

//     await step.sleepUntil(
//       "wait-primary",
//       isTestMode ? secondsFromNow(10) : todayAtIST(20)
//     );

//     if (await step.run("check-completed-before-primary", hasCompletedToday)) {
//       return;
//     }

//     await step.run("send-primary-reminder", async () => {
//       await sendPushNotificationToUser(
//         userId,
//         "🔔 Today’s CMP Card is waiting",
//         "Complete your Identity, Action & Win for today.",
//         { url: "/dashboard/complete-makeover-program/todays-actions" }
//       );
//     });

//     /* ---------------- GENTLE NUDGE ---------------- */

//     await step.sleepUntil(
//       "wait-nudge",
//       isTestMode ? secondsFromNow(20) : todayAtIST(22)
//     );

//     if (await step.run("check-completed-before-nudge", hasCompletedToday)) {
//       return;
//     }

//     await step.run("send-gentle-nudge", async () => {
//       await sendPushNotificationToUser(
//         userId,
//         "⏳ Still time for today’s CMP progress",
//         "One small action is enough.",
//         { url: "/dashboard/complete-makeover-program/todays-actions" }
//       );
//     });
//   }
// );


// /* ------------------------------------------------------------------ */
// /* ------------------------- TIME HELPERS ---------------------------- */
// /* ------------------------------------------------------------------ */

// function getISTStartOfDay(): Date {
//   const d = getNowInIST();
//   d.setHours(0, 0, 0, 0);
//   return d;
// }

// function getISTEndOfDay(): Date {
//   const d = getNowInIST();
//   d.setHours(24, 0, 0, 0);
//   return d;
// }

// function todayAtIST(hour: number): Date {
//   const d = getNowInIST();
//   d.setHours(hour, 0, 0, 0);
//   return d;
// }

// function getNowInIST(): Date {
//   const now = new Date();
//   const utc = now.getTime() + now.getTimezoneOffset() * 60000;
//   return new Date(utc + 5.5 * 60 * 60 * 1000);
// }

// function secondsFromNow(seconds: number): Date {
//   return new Date(Date.now() + seconds * 1000);
// }
