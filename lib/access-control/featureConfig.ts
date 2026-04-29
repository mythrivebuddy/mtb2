// lib/access-control/featureConfig.ts

import { PlanUserType } from "@prisma/client";

export type PlanAccess = "FREE" | "PAID";

//! Use -1 everywhere to represent "no limit"
export const UNLIMITED = -1;
// paid coach and paid sge me difference krna he

export type LimitType = "MONTHLY" | "YEARLY" | "LIFETIME";

export const featureConfig = {
  // deduct dynamic for only prosperity drops and spotlight only
  joyPearls: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { earnRateMultiplier: 1, spendRateMultiplier: 1 },
        ENTHUSIAST: { earnRateMultiplier: 1, spendRateMultiplier: 1 },
      },
      paid: {
        COACH: {
          earnRateMultiplier: 1,
          spendRateMultiplier: 1,
          bonusEligible: true,
        },
        ENTHUSIAST: { earnRateMultiplier: 1, spendRateMultiplier: 1 },
      },
    },
  },
  //* miracleLog feature  implementation done
  miracleLog: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 1, isUpgradeFlagShow: true },
        ENTHUSIAST: { dailyLimit: 1, isUpgradeFlagShow: true },
      },
      paid: {
        COACH: { dailyLimit: 3 },
        ENTHUSIAST: { dailyLimit: 3 },
      },
    },
  },

  // this is set todays focus
  onePercentStart: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 1, isUpgradeFlagShow: true },
        ENTHUSIAST: { dailyLimit: 1, isUpgradeFlagShow: true },
      },
      paid: {
        COACH: { dailyLimit: 3 },
        ENTHUSIAST: { dailyLimit: 3 },
      },
    },
  },
  //  progress vault feature implementation done
  onePercentProgressVault: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 1, isUpgradeFlagShow: true },
        ENTHUSIAST: { dailyLimit: 1, isUpgradeFlagShow: true },
      },
      paid: {
        COACH: { dailyLimit: 3 },
        ENTHUSIAST: { dailyLimit: 3 },
      },
    },
  },
  // daily blooms feature implementation done
  dailyBlooms: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 5, canCreateRecurringBlooms: false },
        ENTHUSIAST: { dailyLimit: 3, canCreateRecurringBlooms: false },
      },
      paid: {
        COACH: { dailyLimit: UNLIMITED, canCreateRecurringBlooms: true },
        ENTHUSIAST: { dailyLimit: UNLIMITED, canCreateRecurringBlooms: true },
      },
    },
  },

  // reminder access control done
  reminders: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 1 },
        ENTHUSIAST: { dailyLimit: 1 },
      },
      paid: {
        COACH: { dailyLimit: UNLIMITED },
        ENTHUSIAST: { dailyLimit: UNLIMITED },
      },
    },
  },

  //* Magic box feature implementation done
  magicBox: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: {
          dailyOpens: 1,
          bonusEligible: false,
          bonusMultiplier: 1,
          minJp: 100,
          maxJp: 500,
        },
        ENTHUSIAST: {
          dailyOpens: 1,
          bonusEligible: false,
          bonusMultiplier: 1,
          minJp: 100,
          maxJp: 500,
        },
      },
      paid: {
        COACH: {
          dailyOpens: 3,
          bonusEligible: true,
          bonusMultiplier: 1.5,
          minJp: 100,
          maxJp: 600,
        },
        ENTHUSIAST: {
          dailyOpens: 3,
          bonusEligible: true,
          bonusMultiplier: 1.5,
          minJp: 100,
          maxJp: 600,
        },
      },
    },
  },
  // spotlight feature implementation done
  spotlight: {
    access: [PlanUserType.COACH],
    plans: {
      free: {
        COACH: {
          eligible: false,
          priorityWeight: 0,
          applyLimitType: "MONTHLY" as LimitType,
          applyLimit: 0,
        },
      },
      paid: {
        COACH: {
          eligible: true,
          priorityWeight: 1,
          applyLimitType: "MONTHLY" as LimitType,
          applyLimit: 1,
        },
      },
    },
  },

  // monthly yearly lifetime
  // buddy lens feature implementation done
  buddyLens: {
    access: [PlanUserType.COACH],
    plans: {
      free: {
        COACH: {
          requestLimitType: "MONTHLY" as LimitType,
          requestLimit: 1,
          earnJPPerReview: 1000,
        },
      },
      paid: {
        COACH: {
          requestLimitType: "MONTHLY" as LimitType,
          requestLimit: 6,
          earnJPPerReview: 1500,
        },
      },
    },
  },

  // monthly yearly lifetime config karna he limit ko
  // default monthly
  // join limit implemented
  // create limit implemented
  // action for coach challenge creation implemented
  challenges: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    actions: {
      join: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
      create: [PlanUserType.COACH],
      issueCertificate: [PlanUserType.COACH],
      groupChat: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    },
    plans: {
      free: {
        COACH: {
          createLimit: 3,
          //TODO paid challenge , commission is left
          canCreatePaidChallenge: false,
          commissionPercent: 25,
          canIssueCertificate: false,
          groupChatLimit: -1,
          joinLimit: -1,
          limitType: "LIFETIME",
          isUpgradeFlagShow: false,
        },
        ENTHUSIAST: {
          createLimit: 3,
          groupChatLimit: -1,
          joinLimit: -1,
          limitType: "MONTHLY",
          isUpgradeFlagShow: true,
        },
      },
      paid: {
        COACH: {
          createLimit: 10,
          canCreatePaidChallenge: true,
          commissionPercent: 5,
          canIssueCertificate: true,
          groupChatLimit: -1,
          joinLimit: -1,
          limitType: "MONTHLY",
        },
        ENTHUSIAST: {
          createLimit: 10,
          canCreatePaidChallenge: false,
          canIssueCertificate: false,
          groupChatLimit: 1,
          joinLimit: -1,
          limitType: "MONTHLY",
        },
      },
    },
  },
  accountabilityHub: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    actions: {
      join: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
      create: [PlanUserType.COACH],
    },
    plans: {
      free: {
        COACH: {
          createLimit: 1,
          limitType: "MONTHLY",
        },
      },
      paid: {
        COACH: {
          createLimit: 1,
          limitType: "MONTHLY",
        },
      },
    },
  },
  discoveryCalls: {
    access: [PlanUserType.COACH],
    plans: {
      free: { COACH: { activeListings: 1 } },
      paid: { COACH: { activeListings: UNLIMITED } },
    },
  },

  liveWebinars: {
    access: [PlanUserType.COACH],
    plans: {
      free: { COACH: { activeListings: 1 } },
      paid: { COACH: { activeListings: UNLIMITED } },
    },
  },

  miniMasteryPrograms: {
    access: [PlanUserType.COACH],

    actions: {
      create: [PlanUserType.COACH],
      publishPaidProgram: [PlanUserType.COACH],
    },

    plans: {
      free: {
        COACH: {
          createLimit: 1,
          commissionPercent: 20,
        },
      },

      paid: {
        COACH: {
          createLimit: UNLIMITED,
          commissionPercent: 10,
        },
      },
    },

    // challenge jaisa hi he
    // free coach paid challenge bana skta he yes / no
    // paid coach paid challenge bana skta he
    // paid coach commission fee percentage
  },
  // prosperity drops feature implementation done
  prosperityDrops: {
    access: [PlanUserType.COACH],
    plans: {
      free: {
        COACH: { eligible: false, priorityWeight: 0 },
      },
      paid: {
        COACH: { eligible: true, priorityWeight: 1 },
      },
    },
  },
  store: {
    access: [PlanUserType.COACH],

    actions: {
      create: [PlanUserType.COACH],
      sell: [PlanUserType.COACH],
    },

    plans: {
      free: {
        COACH: {
          commissionPercent: 15, // same as free challenge
        },
      },

      paid: {
        COACH: {
          commissionPercent: 5, // align with MMP (or 5 if aggressive)
        },
      },
    },
  },
} as const;
