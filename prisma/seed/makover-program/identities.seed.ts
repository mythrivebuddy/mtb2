/// Seeds identity statements per area
import { prisma } from "@/lib/prisma";

const IDENTITIES = [
  {
    areaId: 1,
    statements: [
      "I am a person who prioritizes my health daily",
      "I am disciplined with my body, food, and movement",
      "I am energetic, strong, and resilient",
    ],
  },
  {
    areaId: 2,
    statements: [
      "I am calm and emotionally balanced",
      "I respond thoughtfully rather than reacting emotionally",
      "I manage stress with clarity and control",
    ],
  },
];

export async function seedMakeoverIdentities() {
  for (const group of IDENTITIES) {
    for (const statement of group.statements) {
      await prisma.makeoverIdentityLibrary.upsert({
        where: {
          areaId_statement: {
            areaId: group.areaId,
            statement,
          },
        },
        update: {},
        create: {
          areaId: group.areaId,
          statement,
          isCustom: false,
        },
      });
    }
  }
}
