import { PlanInterval } from '@prisma/client';
import { prisma } from "@/lib/prisma";

async function main() {
  console.log('--- Starting Safe Program Seeder (No overrides) ---');

  // -----------------------------------------------------------
  // 1. CHECK IF PROGRAM EXISTS
  // -----------------------------------------------------------
  const programSlug = '2026-complete-makeover';

  let makeoverProgram = await prisma.program.findUnique({
    where: { slug: programSlug },
  });

  if (!makeoverProgram) {
    makeoverProgram = await prisma.program.create({
      data: {
        name: '2026 Complete Makeover Program',
        slug: programSlug,
        description: 'The definitive one-time purchase program.',
        durationDays: 365,
        isOneTimeProduct: true,
        isActive: true,
      },
    });
    console.log(`[Program] Created: ${makeoverProgram.name}`);
  } else {
    console.log(`[Program] Already exists, not modifying: ${makeoverProgram.name}`);
  }

  // -----------------------------------------------------------
  // 2. CHECK IF PURCHASE PLAN EXISTS
  // -----------------------------------------------------------
  const purchasePlanName = 'Makeover Program Purchase - Multi-Currency';

  let existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: purchasePlanName },
  });

  if (!existingPlan) {
    existingPlan = await prisma.subscriptionPlan.create({
      data: {
        name: purchasePlanName,
        userType: 'ALL',  // valid because you confirmed ALL exists in enum
        interval: PlanInterval.ONE_TIME,
        isActive: true,
        isProgramPlan: true,

        amountINR: 999.0,
        amountUSD: 19.99,

        gstEnabled: true,
        gstPercentage: 18.0,
        description: 'One-time fee for the 2026 Makeover Program.',

        programId: makeoverProgram.id,
      },
    });
    console.log(`[Plan] Created: ${existingPlan.name}`);
  } else {
    console.log(`[Plan] Already exists, not modifying: ${existingPlan.name}`);
  }

  console.log('--- Safe Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('SEEDING ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma?.$disconnect) {
      await prisma.$disconnect();
    }
  });
