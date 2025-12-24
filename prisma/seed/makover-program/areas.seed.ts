/// Seeds the 9 fixed life areas used by the MTB 2026 Makeover Program
import { prisma } from "@/lib/prisma";

const AREAS = [
  {
    id: 1,
    name: "Health & Fitness",
    description:
      "Physical health, energy, movement, nutrition, sleep, stamina, recovery.",
  },
  {
    id: 2,
    name: "Mindset & Emotional Wellbeing",
    description:
      "Emotional regulation, mental clarity, stress management, confidence, resilience, inner stability.",
  },
  {
    id: 3,
    name: "Relationships",
    description:
      "Romantic relationships, family bonds, friendships, communication, boundaries, emotional connection.",
  },
  {
    id: 4,
    name: "Career & Business",
    description:
      "Career direction, entrepreneurship, productivity, leadership, performance, income growth.",
  },
  {
    id: 5,
    name: "Wealth & Finance",
    description:
      "Savings, spending habits, investing basics, wealth mindset, financial discipline and security.",
  },
  {
    id: 6,
    name: "Social Life & Influence",
    description:
      "Social confidence, networking, communication skills, visibility, influence, community presence.",
  },
  {
    id: 7,
    name: "Skills & Intelligence",
    description:
      "Learning new skills, upskilling, cognitive growth, strategic thinking, mastery and execution.",
  },
  {
    id: 8,
    name: "Lifestyle & Personal Upgrades",
    description:
      "Daily routines, environment, time management, systems, habits, quality of life improvements.",
  },
  {
    id: 9,
    name: "Spiritual Growth",
    description:
      "Purpose, self-awareness, inner peace, values, meaning, mindfulness, connection beyond the self.",
  },
];

export async function seedMakeoverAreas() {
  for (const area of AREAS) {
    await prisma.makeoverArea.upsert({
      where: { id: area.id },
      update: {}, // ❌ never mutate admin data
      create: area,
    });
  }
}
