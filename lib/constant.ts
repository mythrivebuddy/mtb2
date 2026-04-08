export const DEFAULT_LEADERBOARD_PAGE = 1;
export const DEFAULT_LEADERBOARD_PAGE_LIMIT = 10;

export const RESERVED_PUBLIC_ROUTES = [
  "dashboard",
  "signin",
  "login",
  "register",
  "about-us",
  "contact",
  "blog",
  "makeover"
];

export const MAKEOVER_PROGRAM_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const CURRENT_MAKEOVER_PROGRAM_QUARTER = 'Q1';

export const  GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const CMP_NOTIFICATIONS = {
  /* =====================================================
     1️⃣ DAILY REMINDERS (MON–SAT)
  ===================================================== */

  DAILY_PRIMARY: {
    title: "🔔 Today’s CMP Card is waiting",
    description:
      "Complete your Identity, Action & Win for today.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  DAILY_GENTLE_NUDGE: {
    title: "⏳ Still time for today’s CMP progress",
    description:
      "One small action is enough.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  /* =====================================================
     2️⃣ SUNDAY (WEEKLY)
  ===================================================== */

  SUNDAY_MORNING: {
    title: "🧭 Sunday Reflection Day",
    description:
      "Review your week & set next week’s focus.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  SUNDAY_EVENING_PENDING: {
    title: "📝 Don’t miss your weekly reflection",
    description:
      "This unlocks your full weekly points.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  /* =====================================================
     3️⃣ QUARTERLY (HIGH IMPACT)
  ===================================================== */

  QUARTER_ENDING_SOON: {
    title: "🔄 Quarter ending soon",
    description:
      "Get ready to review & reset your identity.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  QUARTER_RESET: {
    title: "🚀 New Quarter, New Identity",
    description:
      "Choose your identity & action for this quarter.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  /* =====================================================
     4️⃣ SELF-REWARDS
  ===================================================== */

  REWARD_UNLOCKED: {
    title: "🎉 You unlocked a Self-Reward!",
    description:
      "Claim it and celebrate your progress.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  REWARD_UNCLAIMED: {
    title: "🎁 Your reward is still waiting",
    description:
      "Take a moment to celebrate.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  /* =====================================================
     5️⃣ LEVEL-UP
  ===================================================== */

  LEVEL_UP: {
    title: "🏅 You reached Level {{levelNumber}} - {{levelName}}",
    description:
      "Your consistency is paying off.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  /* =====================================================
     6️⃣ GOA JOURNEY
  ===================================================== */

  GOA_PROGRESS_MILESTONE: {
    title: "🌴 You’re {{goaProgressMilestone}}% on your Goa Journey",
    description:
      "You’re closer to the Goa journey than you think.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  GOA_ELIGIBLE: {
    title: "🌟 You’re now eligible for the Goa Event!",
    description:
      "What a journey this has been.",
    url: "/dashboard/complete-makeover-program/makeover-dashboard",
  },

  /* =====================================================
     7️⃣ INACTIVITY / RE-ENGAGEMENT
  ===================================================== */

  INACTIVITY_3_DAYS: {
    title: "👋 We saved your progress",
    description:
      "Pick up where you left off — just one step today.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  INACTIVITY_7_DAYS: {
    title: "🔁 Your CMP journey is still open",
    description:
      "It’s never about perfection — just restart.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },

  /* =====================================================
     8️⃣ ONBOARDING
  ===================================================== */

  ONBOARDING_PENDING: {
    title: "👣 Start with today’s card",
    description:
      "CMP works one day at a time.",
    url: "/dashboard/complete-makeover-program/todays-actions",
  },
} as const;



export const STATE_NAME_MAP: Record<string, string> = {
  // Andhra Pradesh
  "andhra pradesh": "andhra pradesh",
  "ap": "andhra pradesh",

  // Arunachal Pradesh
  "arunachal pradesh": "arunachal pradesh",

  // Assam
  "assam": "assam",
  "as": "assam",

  // Bihar
  "bihar": "bihar",
  "br": "bihar",

  // Chhattisgarh
  "chhattisgarh": "chhattisgarh",
  "cg": "chhattisgarh",

  // Goa
  "goa": "goa",
  "ga": "goa",

  // Gujarat
  "gujarat": "gujarat",
  "gj": "gujarat",

  // Haryana
  "haryana": "haryana",
  "hr": "haryana",

  // Himachal Pradesh
  "himachal pradesh": "himachal pradesh",
  "hp": "himachal pradesh",

  // Jharkhand
  "jharkhand": "jharkhand",
  "jh": "jharkhand",

  // Karnataka
  "karnataka": "karnataka",
  "ka": "karnataka",

  // Kerala
  "kerala": "kerala",
  "kl": "kerala",

  // Madhya Pradesh
  "madhya pradesh": "madhya pradesh",
  "mp": "madhya pradesh",

  // Maharashtra
  "maharashtra": "maharashtra",
  "mh": "maharashtra",

  // Manipur
  "manipur": "manipur",
  "mn": "manipur",

  // Meghalaya
  "meghalaya": "meghalaya",
  "ml": "meghalaya",

  // Mizoram
  "mizoram": "mizoram",
  "mz": "mizoram",

  // Nagaland
  "nagaland": "nagaland",
  "nl": "nagaland",

  // Odisha
  "odisha": "odisha",
  "orissa": "odisha",
  "od": "odisha",

  // Punjab
  "punjab": "punjab",
  "pb": "punjab",

  // Rajasthan
  "rajasthan": "rajasthan",
  "rj": "rajasthan",

  // Sikkim
  "sikkim": "sikkim",
  "sk": "sikkim",

  // Tamil Nadu
  "tamil nadu": "tamil nadu",
  "tn": "tamil nadu",

  // Telangana
  "telangana": "telangana",
  "ts": "telangana",

  // Tripura
  "tripura": "tripura",
  "tr": "tripura",

  // Uttar Pradesh
  "uttar pradesh": "uttar pradesh",
  "up": "uttar pradesh",

  // Uttarakhand
  "uttarakhand": "uttarakhand",
  "uk": "uttarakhand",
  "uttrakhand": "uttarakhand", // common typo

  // West Bengal
  "west bengal": "west bengal",
  "wb": "west bengal",

  // --- UNION TERRITORIES (important for GST too) ---

  // Delhi
  "delhi": "delhi",
  "new delhi": "delhi",
  "dl": "delhi",

  // Chandigarh
  "chandigarh": "chandigarh",

  // Jammu and Kashmir
  "jammu and kashmir": "jammu and kashmir",
  "j&k": "jammu and kashmir",

  // Ladakh
  "ladakh": "ladakh",

  // Puducherry
  "puducherry": "puducherry",
  "pondicherry": "puducherry",

  // Andaman & Nicobar
  "andaman and nicobar islands": "andaman and nicobar islands",

  // Dadra Nagar Haveli + Daman Diu
  "dadra and nagar haveli and daman and diu":
    "dadra and nagar haveli and daman and diu",
};