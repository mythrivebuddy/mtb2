// lib/access-control/featureConfig.ts

import { PlanUserType } from "@prisma/client";

export type PlanAccess = "FREE" | "PAID";

//! Use -1 everywhere to represent "no limit"
export const UNLIMITED = -1;
// paid coach and paid sge me difference krna he

export const featureConfig = {
    joyPearls: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        plans: {
            free: {
                COACH: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 },
                ENTHUSIAST: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 },
            },
            paid: {
                COACH: {
                    earnRateMultiplier: 1.5,
                    spendRateMultiplier: 0.8,
                    bonusEligible: true,
                },
                ENTHUSIAST: { earnRateMultiplier: 1.5, spendRateMultiplier: 0.8 },
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

    onePercentStart: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        plans: {
            free: {
                COACH: true,
                ENTHUSIAST: true,
            },
            paid: {
                COACH: true,
                ENTHUSIAST: true,
            },
        },
    },

    onePercentProgressVault: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        plans: {
            free: {
                COACH: { dailyLimit: 1 },
                ENTHUSIAST: { dailyLimit: 1 },
            },
            paid: {
                COACH: { dailyLimit: 3 },
                ENTHUSIAST: { dailyLimit: 3 },
            },
        },
    },

    dailyBlooms: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        plans: {
            free: {
                COACH: { dailyLimit: UNLIMITED },
                ENTHUSIAST: { dailyLimit: UNLIMITED },
            },
            paid: {
                COACH: { dailyLimit: UNLIMITED },
                ENTHUSIAST: { dailyLimit: UNLIMITED },
            },
        },
    },


    reminders: {
        access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
        plans: {
            free: {
                COACH: { dailyLimit: UNLIMITED },
                ENTHUSIAST: { dailyLimit: UNLIMITED },
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
                    dailyOpens: 1, bonusEligible: false,
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

    spotlight: {
        access: [PlanUserType.COACH],
        plans: {
            free: {
                COACH: { priorityBoost: 0 },
            },
            paid: {
                COACH: { priorityBoost: 1 },
            },
        },
    },


    buddyLens: {
        access: [PlanUserType.COACH],
        plans: {
            free: {
                COACH: { requestLimit: 1, earnJPPerReview: 500 },
            },
            paid: {
                COACH: { requestLimit: 5, earnJPPerReview: 1500 },
            },
        },
    },


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
                    createLimit: 2,
                    canCreatePaidChallenge: false,
                    commissionPercent: 20,
                    canIssueCertificate: true,
                    groupChatLimit: -1,
                    joinLimit: -1,
                    isUpgradeFlagShow: true,
                },
                ENTHUSIAST: {
                    createLimit: 1,
                    groupChatLimit: -1,
                    joinLimit: -1,
                    isUpgradeFlagShow: true,
                },
            },
            paid: {
                COACH: {
                    createLimit: 3,
                    canCreatePaidChallenge: true,
                    commissionPercent: 10,
                    canIssueCertificate: true,
                    groupChatLimit: -1,
                    joinLimit: -1,
                },
                ENTHUSIAST: {
                    createLimit: 3,
                    canCreatePaidChallenge: false,
                    canIssueCertificate: false,
                    groupChatLimit: -1,
                    joinLimit: -1,
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

    prosperityDrops: {
        access: [PlanUserType.COACH],
        plans: {
            free: { eligible: false },
            paid: { eligible: true, priorityWeight: 1 },
        },
    },
} as const;
