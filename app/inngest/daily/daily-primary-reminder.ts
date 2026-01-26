// import { inngest } from "@/lib/inngest";
// import { prisma } from "@/lib/prisma";

// /**
//  * DAILY REMINDER CRON
//  * Runs at 6:32 PM IST (13:02 UTC), Mon–Sat
//  */
// export const dailyReminderCron = inngest.createFunction(
//   { id: "daily-reminder-cron" },

//   // 🇮🇳 6:32 PM IST → 13:02 UTC
//   { cron: "36 13 * * 1-6" },

//   async ({ step }) => {
//     const users = await step.run("fetch-onboarded-users", async () => {
//       return prisma.userProgramState.findMany({
//         where: {
//           onboarded: true,
//         },
//         select: {
//           userId: true,
//         },
//         take: 100,
//       });
//     });

//     if (!users.length) return;

//     for (const user of users) {
//       await inngest.send({
//         name: "daily.reminder.check",
//         data: { userId: user.userId },
//       });
//     }
//   }
// );
