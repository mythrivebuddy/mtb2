import { prisma } from "@/lib/prisma";

const BADGES = [
  { id: "initiator", name: "Initiator Badge", type: "LEVEL", thresholdPoints: null },
  { id: "consistent", name: "Consistent Badge", type: "LEVEL", thresholdPoints: null },
  { id: "embodied", name: "Embodied Badge", type: "LEVEL", thresholdPoints: null },
  { id: "transforming", name: "Transforming Badge", type: "LEVEL", thresholdPoints: null },
  { id: "master", name: "Identity Master Badge", type: "LEVEL", thresholdPoints: null },

  { id: "bronze", name: "Bronze Progress Badge", type: "MILESTONE", thresholdPoints: 5000 },
  { id: "silver", name: "Silver Consistency Badge", type: "MILESTONE", thresholdPoints: 10000 },
  { id: "gold", name: "Gold Identity Badge", type: "MILESTONE", thresholdPoints: 20000 },
];

export async function seedMakeoverBadges() {
  for (const badge of BADGES) {
    await prisma.makeoverBadge.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
  }
}
