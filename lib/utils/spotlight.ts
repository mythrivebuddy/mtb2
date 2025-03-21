import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function approveSpotlight(spotlightId: string) {
  await prisma.spotlight.update({
    where: { id: spotlightId },
    data: { status: "APPROVED" },
  });
}

export async function activateNextSpotlight() {
  const nextSpotlight = await prisma.spotlight.findFirst({
    where: { status: "APPROVED", isActive: false },
    orderBy: { appliedAt: "asc" }, // Get the oldest approved request
  });

  if (nextSpotlight) {
    await prisma.spotlight.update({
      where: { id: nextSpotlight.id },
      data: {
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day validity
      },
    });
  }
}

export async function checkAndRotateSpotlight() {
  const currentSpotlight = await prisma.spotlight.findFirst({
    where: { isActive: true, expiresAt: { lt: new Date() } }, // Expired spotlight
  });

  if (currentSpotlight) {
    await prisma.$transaction([
      prisma.spotlight.update({
        where: { id: currentSpotlight.id },
        data: { isActive: false },
      }),
    ]);

    // Activate next in queue
    await activateNextSpotlight();
  }
}
