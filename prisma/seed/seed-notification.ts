// prisma/notificationSeedData.ts
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_SEEDS: {
  type: NotificationType;
  name: string;
  title: string;
  message: string;
  url: string;
  isDynamic: boolean;
  audiences?: ("USER" | "COACH" | "ADMIN")[];
}[] = [
  // 1️ DAILY (Mon–Sat)
  {
    type: "CMP_DAILY_PRIMARY",
    name: "CMP Daily Action Reminder",
    title: "🔔 Today’s CMP Card is waiting",
    message: "Complete your Identity, Action & Win for today.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },
  {
    type: "CMP_DAILY_GENTLE_NUDGE",
    name: "CMP Daily Gentle Nudge",
    title: "⏳ Still time for today’s CMP progress",
    message: "One small action is enough.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },

  // 2️ SUNDAY
  {
    type: "CMP_SUNDAY_MORNING",
    name: "CMP Sunday Reflection",
    title: "🧭 Sunday Reflection Day",
    message: "Review your week & set next week’s focus.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },
  {
    type: "CMP_SUNDAY_EVENING_PENDING",
    name: "CMP Pending Sunday Reflection",
    title: "📝 Don’t miss your weekly reflection",
    message: "This unlocks your full weekly points.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },

  // 3️⃣ QUARTERLY
  {
    type: "CMP_QUARTER_ENDING_SOON",
    name: "CMP Quarter Ending Reminder",
    title: "🔄 Quarter ending soon",
    message: "Get ready to review & reset your identity.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: false,
  },
  {
    type: "CMP_QUARTER_RESET",
    name: "CMP Quarterly Reset",
    title: "🚀 New Quarter, New Identity",
    message: "Choose your identity & action for this quarter.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: false,
  },

  // 4️ REWARDS
  {
    type: "CMP_REWARD_UNLOCKED",
    name: "CMP Reward Unlocked",
    title: "🎉 You unlocked a Self-Reward!",
    message: "Claim it and celebrate your progress.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: false,
  },
  {
    type: "CMP_REWARD_UNCLAIMED",
    name: "CMP Unclaimed Reward",
    title: "🎁 Your reward is still waiting",
    message: "Take a moment to celebrate.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: false,
  },

  // 5️ LEVEL UP
  {
    type: "CMP_LEVEL_UP",
    name: "CMP Level Up Alert",
    title: "🏅 You reached Level {{levelNumber}} — {{levelName}}",
    message: "Your consistency is paying off.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: true,
  },

  // 6️ GOA JOURNEY
  {
    type: "CMP_GOA_PROGRESS_MILESTONE",
    name: "CMP Goa Journey Milestone",
    title: "🌴 You’re {{goaProgressMilestone}}% on your Goa Journey",
    message: "Keep going — you’re closer than you think.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: true,
  },
  {
    type: "CMP_GOA_ELIGIBLE",
    name: "CMP Goa Event Eligibility",
    title: "🌟 You’re now eligible for the Goa Event!",
    message: "What a journey this has been.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
    isDynamic: false,
  },

  // 7️ INACTIVITY
  {
    type: "CMP_INACTIVITY_3_DAYS",
    name: "CMP 3-Day Inactivity Check-in",
    title: "👋 We saved your progress",
    message: "Pick up where you left off — just one step today.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },
  {
    type: "CMP_INACTIVITY_7_DAYS",
    name: "CMP 7-Day Inactivity Check-in",
    title: "🔁 Your CMP journey is still open",
    message: "It’s never about perfection — just restart.",
    url: "/dashboard/complete-makeover-program/todays-actions",
    isDynamic: false,
  },

  // 8️ ONBOARDING
  {
    type: "CMP_ONBOARDING_PENDING",
    name: "CMP Onboarding Reminder",
    title: "👣 Start with today’s card",
    message: "CMP works one day at a time.",
    url: "/dashboard/complete-makeover-program/onboarding",
    isDynamic: false,
  },
  // 9 MMP_DAILY_REMINDER
  {
    type: "MMP_DAILY_REMINDER",
    name: "MMP Daily Reminder",
    title: "📚 Your Mini Mastery Program is waiting",
    message: "It's 10 AM — continue your journey today 🚀",
    url: "/dashboard/mini-mastery-programs/program/{{programId}}",
    isDynamic: true,
  },
  // 10 AFFILIATE APPROVAL
  {
    type: "AFFILIATE_APPROVED",
    name: "Affiliate Account Approved",
    title: "🎉 You are now an Affiliate!",
    message:
      "Your affiliate account is active. Start earning commission on your referrals!",
    url: "/dashboard/refer-friend",
    isDynamic: false,
  },
  // 11 Spotlight Active
  {
    type: "SPOTLIGHT_ACTIVE",
    name: "Spotlight Activation",
    title: "Spotlight Active",
    message: "Your spotlight is now active and visible to other users!",
    url: "/dashboard/notifications",
    isDynamic: false,
  },

  // 12. Store purchase
  {
    type: "STORE_PURCHASE",
    name: "Store Purchase Receipt",
    title: "🛍️ Purchase Successful",
    message: "You purchased {{entityName}}",
    url: "/dashboard/store",
    isDynamic: true,
    audiences: ["USER"],
  },
  {
    type: "STORE_SALE",
    name: "New Store Sale Alert",
    title: "🛒 New Product Purchase",
    message: "You made a sale! {{userName}} purchased {{entityName}}",
    url: "/dashboard/store",
    isDynamic: true,
    audiences: ["COACH", "ADMIN"],
  },

  // 13. MMP (Mini Mastery Program) Enrollments
  {
    type: "MMP_JOINED",
    name: "MMP Joined",
    title: "You're In! 🎉",
    message: 'You’ve successfully joined "{{entityName}}". Tap to start.',
    url: "/dashboard/mini-mastery-programs/program/{{entityId}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  {
    type: "MMP_ENROLLMENT_CREATOR",
    name: "MMP New Student Enrollment",
    title: "📘 New Program Enrollment",
    message: "{{userName}} joined {{entityName}}",
    url: "/dashboard/mini-mastery-programs/program/{{entityId}}",
    isDynamic: true,
    audiences: ["COACH", "ADMIN"],
  },
  {
    type: "MMP_ENROLLMENT_ADMIN",
    name: "Admin: MMP New Enrollment",
    title: "New Enrollment",
    message: "{{userName}} joined {{entityName}}",
    url: "/admin/manage-mini-mastery-program/students?programId={{entityId}}",
    isDynamic: true,
    audiences: ["ADMIN"],
  },

  // 14. CHALLENGE Enrollments
  {
    type: "CHALLENGE_JOINED",
    name: "Challenge Joined",
    title: "You're In! 🎉",
    message: 'You’ve successfully joined "{{entityName}}". Tap to start.',
    url: "/dashboard/challenge/my-challenges/{{entityId}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  {
    type: "CHALLENGE_ENROLLMENT_CREATOR",
    name: "Challenge New Participant",
    title: "🎯 New Challenge Participant",
    message: "{{userName}} joined {{entityName}}",
    url: "/dashboard/challenge/my-challenges/{{entityId}}",
    isDynamic: true,
    audiences: ["COACH"],
  },
  {
    type: "CHALLENGE_ENROLLMENT_ADMIN",
    name: "Admin: Challenge New Participant",
    title: "New Enrollment",
    message: "{{userName}} joined {{entityName}}",
    url: "/admin/manage-challenges/users?challengeId={{entityId}}",
    isDynamic: true,
    audiences: ["ADMIN"],
  },

  // 15. STORE (Admin Specific)
  {
    type: "STORE_ORDER_ADMIN",
    name: "Admin: New Store Order",
    title: "🛒 New Store Order",
    message: "{{userName}} purchased {{entityName}}",
    url: "/admin/store/orders",
    isDynamic: true,
    audiences: ["ADMIN"],
  },
  // 16. Aligned Actions
  {
    type: "ALIGNED_ACTION_REMINDER",
    name: "Aligned Action Reminder",
    title: "Aligned Action Reminder",
    message: "Here’s your reminder again 👋",
    url: "/dashboard/aligned-actions",
    isDynamic: false,
    audiences: ["USER"],
  },
  // 17. Aligned Actions (Start & End)
  {
    type: "ALIGNED_ACTION_START",
    name: "Aligned Action Start",
    title: "1% Start Reminder",
    message: "Your task starts in 5 minutes",
    url: "/dashboard/aligned-actions",
    isDynamic: false,
    audiences: ["USER"],
  },
  {
    type: "ALIGNED_ACTION_END",
    name: "Aligned Action End",
    title: "1% End Reminder",
    message: "Your task ends in 5 minutes",
    url: "/dashboard/aligned-actions",
    isDynamic: false,
    audiences: ["USER"],
  },
  // 18 Accountability Hub nudge
  {
    type: "ACCOUNTABILITY_NUDGE",
    name: "Accountability Partner Nudge",
    title: "{{senderName}} nudged you 👋",
    message: "{{description}}",
    url: "{{url}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 19 Accountability Member Added
  {
    type: "ACCOUNTABILITY_MEMBER_ADDED",
    name: "Added to Accountability Group",
    title: "You've been added to a group 🎉",
    message: "Hi {{userName}}, you’ve been added to {{groupName}}.",
    url: "{{groupUrl}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 19. Magic Box & GP
  {
    type: "MAGIC_BOX_SHARED",
    name: "Magic Box Received",
    title: "Magic Box Shared! 🎁",
    message: "You have received {{sharedJpAmount}} GP from {{senderName}}",
    url: "/dashboard/notifications",
    isDynamic: true,
    audiences: ["USER"],
  },
  {
    type: "JP_EARNED",
    name: "Growth Points (GP) Earned",
    title: "GP Earned! ✨",
    message: "You earned {{jpAmount}} GP from {{source}}!",
    url: "/dashboard/transactions-history",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 20. Challenge Chat
  {
    type: "CHALLENGE_CHAT_MESSAGE",
    name: "Challenge Chat Messages",
    title: "{{senderName}} in {{challengeTitle}}",
    message: "{{messageBody}}",
    url: "{{url}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 21. Challenge Penalty
  {
    type: "CHALLENGE_PENALTY",
    name: "Challenge Penalty Warning",
    title: "Challenge Penalty ⚠️",
    message:
      "You missed your daily tasks in one or more challenges.\n\n{{total}} GP has been deducted.\n\nDetails: {{breakdown}}\n\nStay consistent tomorrow to avoid penalties 💪",
    url: "/dashboard/challenge",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 22. New Challenge Participant Broadcast
  {
    type: "CHALLENGE_NEW_PARTICIPANT",
    name: "Challenge Participant Updates",
    title: "New challenger alert 🚀",
    message: '{{userName}} joined "{{challengeTitle}}"!',
    url: "/dashboard/challenge/my-challenges/{{challengeId}}",
    isDynamic: true,
    audiences: ["USER", "COACH"],
  },
  // 23. Accountability Hub - Group Notes
  {
    type: "ACCOUNTABILITY_NOTES_UPDATED",
    name: "Accountability Group Notes Update",
    title: "New note in {{groupName}}",
    message: "{{updatedBy}} updated group notes",
    url: "/dashboard/accountability?groupId={{groupId}}",
    isDynamic: true,
    audiences: ["USER"],
  },
  // 24
  {
    type: "ACCOUNTABILITY_COMMENT_REPLY",
    name: "Goal Comment Replies",
    title: "New Reply",
    message: "{{userName}} replied to your comment.",
    url: "/dashboard/accountability-hub?goalId={{goalId}}",
    isDynamic: true,
  },
  {
    type: "ACCOUNTABILITY_COMMENT_MENTION",
    name: "Goal Comment Mentions",
    title: "You were mentioned",
    message: "{{userName}} mentioned you in a comment.",
    url: "/dashboard/accountability-hub?goalId={{goalId}}",
    isDynamic: true,
  },
  {
    type: "ACCOUNTABILITY_COMMENT_ON_GOAL",
    name: "New Comments on Goals",
    title: "New Comment",
    message: "{{userName}} commented on your goal.",
    url: "/dashboard/accountability-hub?goalId={{goalId}}",
    isDynamic: true,
  },
  {
    type: "CREATOR_PAYOUT_SUCCESS",
    name: "Creator Payout Processed",
    title: "💸 Payout of {{amount}} {{currency}} processed",
    message:
      "Your earnings have been credited successfully. Ref: {{referenceId}}",
    url: "/dashboard/transactions-history",
    isDynamic: true,
  },
  {
    type: "DAILY_BLOOM_PUSH_NOTIFICATION",
    name: "Daily Bloom Reminder",
    title: "Daily Blooms Reminder",
    message: "Don't forget to check your daily blooms!",
    url: "/dashboard/daily-bloom",
    isDynamic: false,
  },
  {
    type: "DAILY_CHALLENGE_PUSH_NOTIFICATION",
    name: "Daily Challenge Reminder",
    title: "Daily Challenge Reminder",
    message: "Don't forget to check your daily challenges!",
    url: "/dashboard/challenge",
    isDynamic: false,
  },
  {
    type: "REMINDER",
    name: "Reminder Notification",
    title: "{{title}}",
    message: "{{description}}",
    url: "{{url}}",
    isDynamic: true,
  },
  {
    type: "AFFILIATE_PAYOUT_SUCCESS",
    name: "Affiliate Payout Processed",
    title: "💸 Payout of {{amount}} {{currency}} processed",
    message:
      "Your affiliate earnings have been credited successfully. Ref: {{referenceId}}",
    url: "/dashboard/transactions-history",
    isDynamic: true,
  },
  {
    type: NotificationType.SPOTLIGHT_APPLIED,
    name: "Spotlight Application",
    title: "Spotlight Application Submitted",
    message:
      "Your Spotlight application has been successfully submitted and is currently under review.",
    isDynamic: false,
    url: "/dashboard",
  },
  {
    type: NotificationType.SPOTLIGHT_APPLIED_ADMIN,
    name: "New Spotlight Application (Admin)",
    title: "📩 New Spotlight Application",
    message:
      "{{userName}} has applied for Spotlight. Review the application and take action.",
    isDynamic: true,
    url: "/admin/spotlight",
    audiences:["ADMIN"]
  },
];


async function main() {
  for (const seed of NOTIFICATION_SEEDS) {
    const exists = await prisma.notificationSettings.findUnique({
      where: { notification_type: seed.type },
      select: { id: true },
    });

    if (exists) {
      // 🔥 ONLY update audiences if missing (preserve admin edits)
      await prisma.notificationSettings.update({
        where: { notification_type: seed.type },
        data: {
          name: seed.name,
          audiences: {
            set: seed.audiences ?? ["USER"],
          },
        },
      });
      continue;
    }

    await prisma.notificationSettings.create({
      data: {
        notification_type: seed.type,
        name: seed.name,
        title: seed.title,
        message: seed.message,
        url: seed.url,
        isDynamic: seed.isDynamic,
        audiences: seed.audiences ?? ["USER"],
      },
    });
  }

  console.log("✅ Notifications seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
