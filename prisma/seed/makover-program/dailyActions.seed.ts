/// Seeds daily action task options per area
import { prisma } from "@/lib/prisma";

const ACTIONS = [
  {
    areaId: 1,
    titles: [
      "Walk a minimum 10,000 steps",
      "Do a structured workout",
      "Follow a planned nutrition choice",
      "Avoid junk food for the day",
      "Drink required water intake",
    ],
  },
  {
    areaId: 2,
    titles: [
      "Meditate or sit in silence",
      "Journal thoughts or emotions",
      "Practice gratitude intentionally",
      "Do a calming ritual",
      "Limit negative inputs",
    ],
  },
];

export async function seedMakeoverDailyActions() {
  for (const group of ACTIONS) {
    for (const title of group.titles) {
      await prisma.makeoverDailyActionLibrary.upsert({
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
