import { prisma } from "@/lib/prisma";
import { MakeoverBadgeType } from "@prisma/client";

/**
 * MTB 2026 – OFFICIAL BADGES
 * SOURCE OF TRUTH: Product Doc
 * MODE: OVERWRITE (one-time migration)
 */

const BADGES = [
  // 🔹 LEVEL BADGES (Unlocked on global level)
  {
    name: "Initiator Badge",
    description: "You began the journey.",
    type: MakeoverBadgeType.LEVEL,
    thresholdPoints: null,
    icon: "Sparkles",
  },
  {
    name: "Consistent Badge",
    description: "You built weekly rhythm.",
    type: MakeoverBadgeType.LEVEL,
    thresholdPoints: null,
    icon: "Flame",
  },
  {
    name: "Embodied Badge",
    description: "Your actions match your identity.",
    type: MakeoverBadgeType.LEVEL,
    thresholdPoints: null,
    icon: "Waves",
  },
  {
    name: "Transforming Badge",
    description: "Visible transformation happening.",
    type: MakeoverBadgeType.LEVEL,
    thresholdPoints: null,
    icon: "Zap",
  },
  {
    name: "Master Badge",
    description: "You embody the Master Identity.",
    type: MakeoverBadgeType.LEVEL,
    thresholdPoints: null,
    icon: "Crown",
  },

  // 🔹 MILESTONE BADGES (Points-based)
  {
    name: "Bronze Progress Badge",
    description: "You made strong early progress.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 5000,
    icon: "Medal",
  },
  {
    name: "Silver Consistency Badge",
    description: "You’ve built real consistency.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 10000,
    icon: "Shield",
  },
  {
    name: "Gold Identity Badge",
    description: "Your identity is shifting.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 20000,
    icon: "Award",
  },
  {
    name: "Diamond Discipline Badge",
    description: "You display elite discipline.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 30000,
    icon: "Gem",
  },
  {
    name: "Elite Growth Badge",
    description: "You are growing above average.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 40000,
    icon: "Star",
  },
  {
    name: "Mastery Path Badge",
    description: "You’re on the journey to mastery.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 50000,
    icon: "Compass",
  },
  {
    name: "Half-Year Mastery Badge",
    description: "High-performing transformation.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 57600,
    icon: "ShieldCheck",
  },
  {
    name: "Century Badge",
    description: "100k earned — serious contender.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 100000,
    icon: "Swords",
  },
  {
    name: "Year Completion Badge",
    description: "Maximum potential achieved.",
    type: MakeoverBadgeType.MILESTONE,
    thresholdPoints: 172800,
    icon: "Trophy",
  },
];

export async function seedMakeoverBadges() {
  for (const badge of BADGES) {
     const exists = await prisma.makeoverBadge.findFirst({
      where: { name: badge.name },
      select: { id: true },
    });

    if (exists) {
      // 🚫 DO NOT overwrite admin changes
      continue;
    }

    await prisma.makeoverBadge.create({
      data: badge,
    });
  }

  console.log("✅ MTB 2026 CMP badges seeded");
}
