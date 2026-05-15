import { NotificationType } from "@prisma/client";

export const NOTIFICATION_CATEGORIES = {
  feature_notifications: {
    "CMP (Complete Makeover Program)": [
      "CMP_DAILY_PRIMARY",
      "CMP_DAILY_GENTLE_NUDGE",
      "CMP_SUNDAY_MORNING",
      "CMP_SUNDAY_EVENING_PENDING",
      "CMP_QUARTER_ENDING_SOON",
      "CMP_QUARTER_RESET",
      "CMP_REWARD_UNLOCKED",
      "CMP_REWARD_UNCLAIMED",
      "CMP_LEVEL_UP",
      "CMP_GOA_PROGRESS_MILESTONE",
      "CMP_GOA_ELIGIBLE",
      "CMP_INACTIVITY_3_DAYS",
      "CMP_INACTIVITY_7_DAYS",
      "CMP_ONBOARDING_PENDING"
    ],
    "MMP (Mini Mastery)": [
      "MMP_DAILY_REMINDER",
      "MMP_JOINED",
      "MMP_ENROLLMENT_CREATOR",
      "MMP_ENROLLMENT_ADMIN"
    ],
    Challenges: [
      "CHALLENGE_JOINED",
      "CHALLENGE_ENROLLMENT_CREATOR",
      "CHALLENGE_ENROLLMENT_ADMIN",
      "CHALLENGE_CHAT_MESSAGE",
      "CHALLENGE_PENALTY",
      "CHALLENGE_NEW_PARTICIPANT",
      "DAILY_CHALLENGE_PUSH_NOTIFICATION"
    ],
    "Social & Accountability": [
      "ACCOUNTABILITY_NUDGE",
      "ACCOUNTABILITY_MEMBER_ADDED",
      "ACCOUNTABILITY_NOTES_UPDATED",
      "ACCOUNTABILITY_COMMENT_REPLY",
      "ACCOUNTABILITY_COMMENT_MENTION",
      "ACCOUNTABILITY_COMMENT_ON_GOAL"
    ]
  },

  system_notifications: [
    "AFFILIATE_APPROVED",
    "SPOTLIGHT_ACTIVE",
    "STORE_PURCHASE",
    "STORE_SALE",
    "STORE_ORDER_ADMIN",
    "MAGIC_BOX_SHARED",
    "JP_EARNED",
    "CREATOR_PAYOUT_SUCCESS",
    "DAILY_BLOOM_PUSH_NOTIFICATION"
  ],

  other_notifications: [
    "ALIGNED_ACTION_REMINDER",
    "ALIGNED_ACTION_START",
    "ALIGNED_ACTION_END",
    "REMINDER"
  ]
}as const satisfies {
  feature_notifications: Record<string, readonly NotificationType[]>;
  system_notifications: readonly NotificationType[];
  other_notifications: readonly NotificationType[];
};