/// Seeds selectable goal library per area (editable by admin later)
import {prisma} from "@/lib/prisma"

type GoalSeed = {
  areaId: number;
  titles: string[];
};

const GOALS: GoalSeed[] = [
  {
    areaId: 1,
    titles: [
      "Lose 8–12 kg sustainably",
      "Build a consistent daily movement habit",
      "Normalize sleep (7–8 hrs consistently)",
      "Feel energetic throughout the day",
      "Build a disciplined nutrition routine",
    ],
  },
  {
    areaId: 2,
    titles: [
      "Reduce daily stress and anxiety",
      "Build emotional stability and calmness",
      "Improve focus and mental clarity",
      "Overcome overthinking patterns",
      "Build confidence and self-trust",
    ],
  },
  // 👉 Repeat pattern for remaining areas if needed
];

export async function seedMakeoverGoals() {
  for (const group of GOALS) {
    for (const title of group.titles) {
      await prisma.makeoverGoalLibrary.upsert({
        where: {
          areaId_title: {
            areaId: group.areaId,
            title,
          },
        },
        update: {},
        create: {
          areaId: group.areaId,
          title,
          isCustom: false,
        },
      });
    }
  }
}
