/// Seeds the 9 fixed life areas used by the MTB 2026 Makeover Program
import { prisma } from "@/lib/prisma";

const AREAS = [
  { id: 1, name: "Health & Fitness" },
  { id: 2, name: "Mindset & Emotional Wellbeing" },
  { id: 3, name: "Relationships" },
  { id: 4, name: "Career & Business" },
  { id: 5, name: "Wealth & Finance" },
  { id: 6, name: "Social Life & Influence" },
  { id: 7, name: "Skills & Intelligence" },
  { id: 8, name: "Lifestyle & Personal Upgrades" },
  { id: 9, name: "Spiritual Growth" },
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
