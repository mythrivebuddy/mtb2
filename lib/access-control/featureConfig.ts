// lib/access-control/featureConfig.ts

import { PlanUserType } from "@prisma/client";

export type PlanAccess = "FREE" | "PAID";

//! Use -1 everywhere to represent "no limit"
export const UNLIMITED = -1;
// paid coach and paid sge me difference krna he

export const featureConfig = {
    joyPearls: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: {
            earnRateMultiplier: 1,
            spendRateMultiplier: 1.2,
        },
        paid: {
            earnRateMultiplier: 1.5,
            spendRateMultiplier: 0.8,
            bonusEligible: true,
        },

    },
    //* miracleLog feature  implementation done
    miracleLog: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: { dailyLimit: 1 },
        paid: { dailyLimit: 3 },
    },

    onePercentStart: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: true,
        paid: true,
    },

    onePercentProgressVault: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: true,
        paid: true,
        // SAME MIRACLE LOG JAISA HI HE
    },

    dailyBlooms: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: true,
        paid: true,
    },

    reminders: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: true,
        paid: true,
    },
    //* Magic box feature implementation done 
    magicBox: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: {
            dailyOpens: 1,
            bonusEligible: false,
            bonusMultiplier: 1 // safe and default multiplier for free users
        },
        paid: {
            dailyOpens: 1,
            bonusEligible: true,
            bonusMultiplier: 1.5 // paid users get a 50% boost on bonuses earned from the magic box
        },
    },

    spotlight: {
        access: [PlanUserType.COACH],
        free: { priorityBoost: 0 },
        paid: { priorityBoost: 1 },
        //fcfs basis pe hoga ye feature dono ke liye but paid users ko thoda sa jyada chance milega spotlight me aane ka
    },

    buddyLens: {
        access: [PlanUserType.COACH],
        free: { requestLimit: 1, earnJPPerReview: 500 },
        paid: { requestLimit: 5, earnJPPerReview: 1500 },
        // only coach review ke liye option baad me sge ka bhi kar skte he admin se 
    },

    challenges: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        actions: {
            join: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
            create: [PlanUserType.COACH],
            issueCertificate: [PlanUserType.COACH],  // free coach different and paid coach different control 
            // challengeGroupChat
        },
        free: { createLimit: 2 },  // join limit 
        paid: { createLimit: UNLIMITED },
        // free coach paid challenge bana skta he yes / no 
        // paid coach paid challenge bana skta he 
        // paid coach commission fee percentage 
    },

    challengeGroupChat: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        free: true,
        paid: true,
    },

    discoveryCalls: {
        access: [PlanUserType.COACH],
        free: { activeListings: 1 },
        paid: { activeListings: UNLIMITED },
    },

    liveWebinars: {
        access: [PlanUserType.COACH],
        free: { activeSessions: 1 },
        paid: { activeSessions: UNLIMITED },
    },

    miniMasteryPrograms: {
        access: [PlanUserType.COACH],
        free: { activePrograms: 1 },
        paid: { activePrograms: UNLIMITED },
        // challenge jaisa hi he 
           // free coach paid challenge bana skta he yes / no 
        // paid coach paid challenge bana skta he 
        // paid coach commission fee percentage 
    },

    prosperityDrops: {
        access: [PlanUserType.COACH],
        free: { eligible: false },
        paid: { eligible: true, priorityWeight: 1 },
    },
} as const;
