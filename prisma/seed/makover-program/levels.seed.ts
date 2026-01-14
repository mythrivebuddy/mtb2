import { prisma } from "@/lib/prisma";

//! OVERWRITE MODE – run ONCE in prod, then switch to admin-safe seeder

const LEVELS = [
  {
    id: 1,
    name: "Initiator",
    minPoints: 0,
    icon: "Sparkles",
    levelTheme: "Starting the Journey",
    identityState: "I am showing up.",
  },
  {
    id: 2,
    name: "Consistent",
    minPoints: 15000,
    icon: "Flame",
    levelTheme: "Stability & Discipline",
    identityState: "I follow through.",
  },
  {
    id: 3,
    name: "Embodied",
    minPoints: 40000,
    icon: "Waves",
    levelTheme: "Identity → Action Alignment",
    identityState: "I act like the person I want to become.",
  },
  {
    id: 4,
    name: "Transforming",
    minPoints: 80000,
    icon: "Zap",
    levelTheme: "Real Transformation & Momentum",
    identityState: "My new identity is becoming natural.",
  },
  {
    id: 5,
    name: "Identity Master",
    minPoints: 120000,
    icon: "Crown",
    levelTheme: "Sustained Identity & Leadership",
    identityState: "This is who I am now.",
  },
];

export async function seedMakeoverLevels() {
  for (const level of LEVELS) {
    await prisma.makeoverLevel.upsert({
      where: { id: level.id },
      update: {
        name: level.name,
        minPoints: level.minPoints,
        icon: level.icon,
        levelTheme: level.levelTheme,
        identityState: level.identityState,
      },
      create: level,
    });
  }

  console.log("✅ MTB 2026 CMP levels seeded (overwrite mode)");
}
