/// prisma/seed/makover-program/index.ts
import { seedMakeoverAreas } from "./areas.seed";
import { seedMakeoverLevels } from "./levels.seed";
import { seedMakeoverGoals } from "./goals.seed";
import { seedMakeoverIdentities } from "./identities.seed";
import { seedMakeoverDailyActions } from "./dailyActions.seed";
import { seedMakeoverBadges } from "./badges.seed";
import { seedMakeoverSelfRewardLibrary } from "./self-rewards.seed";

async function main() {
  console.log("🌱 Seeding Makeover Program data...");

  await seedMakeoverAreas();
  await seedMakeoverLevels();
  await seedMakeoverGoals();
  await seedMakeoverIdentities();
  await seedMakeoverDailyActions();
  await seedMakeoverBadges();
  await seedMakeoverSelfRewardLibrary()

  console.log("✅ Makeover Program seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Makeover seed failed", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
