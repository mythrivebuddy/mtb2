import { prisma } from "@/lib/prisma";
import { PlanInterval, PlanUserType } from "@prisma/client";

// * this seed script is meant for production as well
async function main() {
  const subscriptionPlans = [
    {
        name:"Monthly Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.MONTHLY,
        amountINR:3999,
        amountUSD:49,      
    },
    {
        name:"Yearly Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.YEARLY,
        amountINR:19999,
        amountUSD:299,      
    },
    {
        name:"Lifetime Plan for Coach and Solopreneur",
        userType:PlanUserType.SOLOPRENEUR,
        interval:PlanInterval.LIFETIME,
        amountINR:199999,
        amountUSD:2999,      
    },
    {
        name:"Yearly Plan for Self Growth Enthusiast",
        userType:PlanUserType.ENTHUSIAST,
        interval:PlanInterval.YEARLY,
        amountINR:500,
        amountUSD:9.99,      
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
