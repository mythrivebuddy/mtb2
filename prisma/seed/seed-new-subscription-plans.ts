import { prisma } from "@/lib/prisma";
import { PlanInterval, PlanUserType } from "@prisma/client";

// * this seed script is meant for production as well
async function main() {
  const subscriptionPlans = [
    {
    name: "Free",
    amountINR: 0,
    amountUSD: 0,
    interval: PlanInterval.FREE,
    userType: PlanUserType.SOLOPRENEUR,
    features: [
      "Access Daily Blooms",
      "Use 1% Start & Progress Vault",
      "Limited community visibility",
    ]
    },
    {
        name:"Monthly Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.MONTHLY,
        amountINR:3999,
        amountUSD:49,      
        features:[
          "Full business growth toolkit",
          "Showcase & promote Discovery Calls",
          "Access Spotlight & visibility features",
        ],
    },
    {
        name:"Yearly Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.YEARLY,
        amountINR:19999,
        amountUSD:299,      
        features:[
          "Save 50% & boost visibility",
          "Priority placement in Discovery Calls",
          "Premium BuddyLens feedback sessions",
        ],
    },
    {
        name:"Lifetime Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.LIFETIME,
        amountINR:199999,
        amountUSD:2999,   
        features:[
          "Lifetime access to everything",
          "Highest visibility & ranking forever",
          "No renewals. No limits. No extra fees.",
        ],   
    },
    {
        name:"Yearly Plan for Self Growth Enthusiast",
        userType:PlanUserType.ENTHUSIAST,
        interval:PlanInterval.YEARLY,
        amountINR:500,
        amountUSD:9.99,     
        features:[
          "Full access to Miracle Log, Magic Box, 1% Start & 1% Progress Vault",
          "Join challenges, track habits, and stay gently accountable",
          "Browse and book coaches whenever you’re ready for deeper support"
        ],
    }
  ]

  for (const subscriptionPlan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: subscriptionPlan.name },
      update: {},
      create: subscriptionPlan,
    });
  }

  console.log("Seed data for new subscription plans inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
