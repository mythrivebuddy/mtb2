import { PrismaClient, Prisma, PlanUserType, FeatureUserType } from "@prisma/client";

const prisma = new PrismaClient();

export type PlanAccess = "FREE" | "PAID";
export type LimitType = "MONTHLY" | "YEARLY" | "LIFETIME";
export const UNLIMITED = -1;

// ==========================================
// 🔥 1. FEATURE CONFIG
// ==========================================

const featureConfig = {
  joyPearls: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 },
        ENTHUSIAST: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 },
      },
      paid: {
        COACH: { earnRateMultiplier: 1.5, spendRateMultiplier: 0.8, bonusEligible: true },
        ENTHUSIAST: { earnRateMultiplier: 1.5, spendRateMultiplier: 0.8 },
      },
    },
  },
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
        COACH: { dailyLimit: 1, isUpgradeFlagShow: true },
        ENTHUSIAST: { dailyLimit: 1, isUpgradeFlagShow: true },
      },
      paid: {
        COACH: { dailyLimit: 3 },
        ENTHUSIAST: { dailyLimit: 3 },
      },
    },
  },
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
  dailyBlooms: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyLimit: 3 },
        ENTHUSIAST: { dailyLimit: 3 },
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
        COACH: { dailyLimit: 1 },
        ENTHUSIAST: { dailyLimit: 1 },
      },
      paid: {
        COACH: { dailyLimit: UNLIMITED },
        ENTHUSIAST: { dailyLimit: UNLIMITED },
      },
    },
  },
  magicBox: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    plans: {
      free: {
        COACH: { dailyOpens: 1, bonusEligible: false, bonusMultiplier: 1, minJp: 100, maxJp: 500 },
        ENTHUSIAST: { dailyOpens: 1, bonusEligible: false, bonusMultiplier: 1, minJp: 100, maxJp: 500 },
      },
      paid: {
        COACH: { dailyOpens: 3, bonusEligible: true, bonusMultiplier: 1.5, minJp: 100, maxJp: 600 },
        ENTHUSIAST: { dailyOpens: 3, bonusEligible: true, bonusMultiplier: 1.5, minJp: 100, maxJp: 600 },
      },
    },
  },
  spotlight: {
    access: [PlanUserType.COACH],
    plans: {
      free: {
        COACH: { eligible: false, priorityWeight: 0, applyLimitType: "MONTHLY" as LimitType, applyLimit: 0 },
      },
      paid: {
        COACH: { eligible: true, priorityWeight: 1, applyLimitType: "MONTHLY" as LimitType, applyLimit: 1 },
      },
    },
  },
  buddyLens: {
    access: [PlanUserType.COACH],
    plans: {
      free: {
        COACH: { requestLimitType: "MONTHLY" as LimitType, requestLimit: 1, earnJPPerReview: 1000 },
      },
      paid: {
        COACH: { requestLimitType: "MONTHLY" as LimitType, requestLimit: 6, earnJPPerReview: 1500 },
      },
    },
  },
  challenges: {
    access: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    actions: {
      join: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
      create: [PlanUserType.COACH, PlanUserType.ENTHUSIAST],
      issueCertificate: [PlanUserType.COACH],
      groupChat: [PlanUserType.ENTHUSIAST, PlanUserType.COACH],
    },
    plans: {
      free: {
        COACH: { createLimit: 10, canCreatePaidChallenge: false, commissionPercent: 25, canIssueCertificate: false, groupChatLimit: -1, joinLimit: -1, limitType: "LIFETIME" as LimitType, isUpgradeFlagShow: false },
        ENTHUSIAST: { createLimit: 3, groupChatLimit: -1, joinLimit: -1, limitType: "MONTHLY" as LimitType, isUpgradeFlagShow: true },
      },
      paid: {
        COACH: { createLimit: 10, canCreatePaidChallenge: true, commissionPercent: 5, canIssueCertificate: true, groupChatLimit: -1, joinLimit: -1, limitType: "MONTHLY" as LimitType },
        ENTHUSIAST: { createLimit: 10, canCreatePaidChallenge: false, canIssueCertificate: false, groupChatLimit: 1, joinLimit: -1, limitType: "MONTHLY" as LimitType },
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
        COACH: { createLimit: 1, limitType: "MONTHLY" as LimitType },
      },
      paid: {
        COACH: { createLimit: 1, limitType: "MONTHLY" as LimitType },
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
        COACH: { createLimit: 1, commissionPercent: 20 },
      },
      paid: {
        COACH: { createLimit: UNLIMITED, commissionPercent: 10 },
      },
    },
  },
  prosperityDrops: {
    access: [PlanUserType.COACH],
    plans: {
      free: { COACH: { eligible: false, priorityWeight: 0 } },
      paid: { COACH: { eligible: true, priorityWeight: 1 } },
    },
  },
};

// ==========================================
// 🔥 2. RICH CONFIG SCHEMAS
// ==========================================

type SchemaField = {
  type: "number" | "boolean" | "string" | "select";
  label: string;
  options?: string[];
  default?: unknown;
  nullable: true;
};

const FEATURE_SCHEMAS: Record<string, Record<string, SchemaField>> = {
  joyPearls: {
    earnRateMultiplier: { type: "number", label: "Earn Rate Multiplier", default: 1, nullable: true },
    spendRateMultiplier: { type: "number", label: "Spend Rate Multiplier", default: 1, nullable: true },
    bonusEligible: { type: "boolean", label: "Bonus Eligible", default: false, nullable: true },
  },
  miracleLog: {
    dailyLimit: { type: "number", label: "Daily Limit", default: 1, nullable: true },
    isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true, nullable: true },
  },
  onePercentStart: {
    dailyLimit: { type: "number", label: "Daily Limit", default: 1, nullable: true },
    isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true, nullable: true },
  },
  onePercentProgressVault: {
    dailyLimit: { type: "number", label: "Daily Limit", default: 1, nullable: true },
    isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true, nullable: true },
  },
  dailyBlooms: {
    dailyLimit: { type: "number", label: "Daily Limit (-1 unlimited)", default: 3, nullable: true },
  },
  reminders: {
    dailyLimit: { type: "number", label: "Daily Limit (-1 unlimited)", default: 1, nullable: true },
  },
  magicBox: {
    dailyOpens: { type: "number", label: "Daily Opens", default: 1, nullable: true },
    bonusEligible: { type: "boolean", label: "Bonus Eligible", default: false, nullable: true },
    bonusMultiplier: { type: "number", label: "Bonus Multiplier", default: 1, nullable: true },
    minJp: { type: "number", label: "Min JP", default: 100, nullable: true },
    maxJp: { type: "number", label: "Max JP", default: 500, nullable: true },
  },
  spotlight: {
    eligible: { type: "boolean", label: "Eligible", default: false, nullable: true },
    priorityWeight: { type: "number", label: "Priority Weight", default: 0, nullable: true },
    applyLimitType: { type: "select", label: "Apply Limit Type", options: ["MONTHLY", "YEARLY", "LIFETIME"], default: "MONTHLY", nullable: true },
    applyLimit: { type: "number", label: "Apply Limit", default: 0, nullable: true },
  },
  buddyLens: {
    requestLimitType: { type: "select", label: "Request Limit Type", options: ["MONTHLY", "YEARLY", "LIFETIME"], default: "MONTHLY", nullable: true },
    requestLimit: { type: "number", label: "Request Limit", default: 1, nullable: true },
    earnJPPerReview: { type: "number", label: "Earn JP Per Review", default: 1000, nullable: true },
  },
  challenges: {
    createLimit: { type: "number", label: "Create Limit", default: 3, nullable: true },
    canCreatePaidChallenge: { type: "boolean", label: "Paid Challenge", default: false, nullable: true },
    commissionPercent: { type: "number", label: "Commission %", default: 25, nullable: true },
    canIssueCertificate: { type: "boolean", label: "Issue Certificate", default: false, nullable: true },
    groupChatLimit: { type: "number", label: "Group Chat Limit", default: -1, nullable: true },
    joinLimit: { type: "number", label: "Join Limit", default: -1, nullable: true },
    limitType: { type: "select", label: "Limit Type", options: ["MONTHLY", "YEARLY", "LIFETIME"], default: "MONTHLY", nullable: true },
    isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: false, nullable: true },
  },
  accountabilityHub: {
    createLimit: { type: "number", label: "Create Limit", default: 1, nullable: true },
    limitType: { type: "select", label: "Limit Type", options: ["MONTHLY", "YEARLY", "LIFETIME"], default: "MONTHLY", nullable: true },
  },
  discoveryCalls: {
    activeListings: { type: "number", label: "Active Listings", default: 1, nullable: true },
  },
  liveWebinars: {
    activeListings: { type: "number", label: "Active Listings", default: 1, nullable: true },
  },
  miniMasteryPrograms: {
    createLimit: { type: "number", label: "Create Limit (-1 unlimited)", default: 1, nullable: true },
    commissionPercent: { type: "number", label: "Commission %", default: 20, nullable: true },
  },
  prosperityDrops: {
    eligible: { type: "boolean", label: "Eligible", default: false, nullable: true },
    priorityWeight: { type: "number", label: "Priority Weight", default: 0, nullable: true },
  },
};

// ==========================================
// 🔥 3. TYPES
// ==========================================

type Membership = "FREE" | "PAID";

const MEMBERSHIP_MAP: Record<string, Membership> = {
  free: "FREE",
  paid: "PAID",
};

type FeatureConfigEntry = {
  access: PlanUserType[];
  actions?: Record<string, PlanUserType[]>;
  plans: Record<string, Record<string, Record<string, unknown>>>;
};

// ==========================================
// 🔥 4. HELPERS
// ==========================================

function normalizeConfig(config: Record<string, unknown>, allKeys: string[]): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const key of allKeys) {
    normalized[key] = config[key] !== undefined ? config[key] : null;
  }
  return normalized;
}

// ==========================================
// 🔥 5. SEEDING LOGIC
// ==========================================

async function seedFeatures() {
  console.log("🌱 Seeding FULL feature config (with rich schema)...");

  for (const [key, rawValue] of Object.entries(featureConfig)) {
    const value = rawValue as FeatureConfigEntry;

    const allowedUserTypes = [...value.access] as FeatureUserType[];
    const actions = value.actions ? (value.actions as Prisma.InputJsonValue) : undefined;
    const configSchema = FEATURE_SCHEMAS[key] ?? null;
    const allKeys = configSchema ? Object.keys(configSchema) : [];

    // FEATURE UPSERT
    const feature = await prisma.feature.upsert({
      where: { key },
      update: {
        allowedUserTypes,
        ...(actions !== undefined && { actions }),
        configSchema: configSchema as Prisma.InputJsonValue,
        name: key,
      },
      create: {
        key,
        name: key,
        description: null,
        allowedUserTypes,
        actions: actions ?? Prisma.JsonNull,
        configSchema: configSchema as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    // PLAN CONFIGS
    for (const [planKey, planValue] of Object.entries(value.plans)) {
      const membership = MEMBERSHIP_MAP[planKey];

      for (const [userType, rawConfig] of Object.entries(planValue)) {
        const typedUserType = userType as FeatureUserType;
        const config = normalizeConfig(rawConfig as Record<string, unknown>, allKeys);

        const existing = await prisma.featurePlanConfig.findUnique({
          where: {
            featureId_membership_userType: {
              featureId: feature.id,
              membership,
              userType: typedUserType,
            },
          },
        });

        if (!existing) {
          const created = await prisma.featurePlanConfig.create({
            data: {
              featureId: feature.id,
              membership,
              userType: typedUserType,
              isActive: true,
              config: config as Prisma.InputJsonValue,
            },
          });

          await prisma.featureConfigAudit.create({
            data: {
              configId: created.id,
              oldConfig: Prisma.JsonNull,
              newConfig: config as Prisma.InputJsonValue,
              updatedBy: "SYSTEM",
              note: "Seeded normalized config",
            },
          });
        } else {
          await prisma.featurePlanConfig.update({
            where: { id: existing.id },
            data: { config: config as Prisma.InputJsonValue },
          });
        }
      }
    }
  }

  console.log("✅ FULL feature seeding completed");
}

async function main() {
  try {
    await seedFeatures();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();