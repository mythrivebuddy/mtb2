/// Seeds the 5 fixed identity-based transformation levels
import {prisma} from "@/lib/prisma";

const LEVELS = [
  { id: 1, name: "Initiator", minPoints: 0 },
  { id: 2, name: "Consistent", minPoints: 15000 },
  { id: 3, name: "Embodied", minPoints: 40000 },
  { id: 4, name: "Transforming", minPoints: 80000 },
  { id: 5, name: "Identity Master", minPoints: 120000 },
];

export async function seedMakeoverLevels() {
  for (const level of LEVELS) {
    await prisma.makeoverLevel.upsert({
      where: { id: level.id },
      update: {},
      create: level,
    });
  }
}
