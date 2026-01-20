import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Identity rule:
 * reward is unique by (levelId + minPoints)
 * Seeder never updates existing rows
 */

const SELF_REWARD_LIBRARY = [
  // ================= LEVEL 1 : INITIATOR =================
  { levelId: 1, levelName: "Initiator", minPoints: 750, title: "Tea or coffee break", description: "Make a cup of tea or coffee and enjoy it calmly." },
  { levelId: 1, levelName: "Initiator", minPoints: 1500, title: "10 minutes of rest", description: "Sit or lie down for 10 minutes with no phone." },
  { levelId: 1, levelName: "Initiator", minPoints: 2250, title: "Favorite snack", description: "Eat something you enjoy without guilt." },
  { levelId: 1, levelName: "Initiator", minPoints: 3000, title: "Music break", description: "Listen to a few songs you love." },
  { levelId: 1, levelName: "Initiator", minPoints: 4500, title: "Fresh air walk", description: "Step outside for a short walk or fresh air." },
  { levelId: 1, levelName: "Initiator", minPoints: 6000, title: "30 minutes to relax", description: "Lie down or stretch and relax your body." },
  { levelId: 1, levelName: "Initiator", minPoints: 8250, title: "Check in with someone", description: "Call or text someone you feel safe with." },
  { levelId: 1, levelName: "Initiator", minPoints: 10500, title: "Watch something light", description: "Watch one episode or casual YouTube." },
  { levelId: 1, levelName: "Initiator", minPoints: 12750, title: "Small personal purchase", description: "Buy a small useful or comforting item." },
  { levelId: 1, levelName: "Initiator", minPoints: 15000, title: "Read a book", description: "Spend time reading or buy a book you like." },

  // ================= LEVEL 2 : CONSISTENT =================
  { levelId: 2, levelName: "Consistent", minPoints: 21600, title: "Cafe visit", description: "Visit a café or order your favorite drink." },
  { levelId: 2, levelName: "Consistent", minPoints: 28800, title: "Long walk with music", description: "Take a long walk with your playlist." },
  { levelId: 2, levelName: "Consistent", minPoints: 36000, title: "Hobby time", description: "Spend time doing a hobby you enjoy." },
  { levelId: 2, levelName: "Consistent", minPoints: 43200, title: "Favorite meal", description: "Eat your favorite meal without rushing." },
  { levelId: 2, levelName: "Consistent", minPoints: 50400, title: "Digital detox evening", description: "Spend an evening with minimal phone use." },
  { levelId: 2, levelName: "Consistent", minPoints: 57600, title: "At-home self-care", description: "Do a simple self-care routine at home." },
  { levelId: 2, levelName: "Consistent", minPoints: 64800, title: "Creative session", description: "Create or build something just for fun." },
  { levelId: 2, levelName: "Consistent", minPoints: 72000, title: "Solo reflection", description: "Journal or reflect quietly." },
  { levelId: 2, levelName: "Consistent", minPoints: 79200, title: "Small outing", description: "Go out alone for a short refreshing outing." },
  { levelId: 2, levelName: "Consistent", minPoints: 86400, title: "Quality self-date", description: "Plan a relaxed self-date." },

  // ================= LEVEL 3 : EMBODIED =================
  { levelId: 3, levelName: "Embodied", minPoints: 93600, title: "Nature time", description: "Spend time in nature or a park." },
  { levelId: 3, levelName: "Embodied", minPoints: 100800, title: "Skill practice", description: "Practice a skill you want to improve." },
  { levelId: 3, levelName: "Embodied", minPoints: 108000, title: "Deep journaling", description: "Write honestly about how life feels." },
  { levelId: 3, levelName: "Embodied", minPoints: 115200, title: "Mindfulness session", description: "Do a guided meditation or breathing exercise." },
  { levelId: 3, levelName: "Embodied", minPoints: 122400, title: "Learning time", description: "Watch or read something educational." },
  { levelId: 3, levelName: "Embodied", minPoints: 129600, title: "Upgrade daily life", description: "Upgrade something you use every day." },
  { levelId: 3, levelName: "Embodied", minPoints: 136800, title: "Focused deep work", description: "Work deeply on something meaningful." },
  { levelId: 3, levelName: "Embodied", minPoints: 144000, title: "Meaningful conversation", description: "Have a real conversation without distractions." },
  { levelId: 3, levelName: "Embodied", minPoints: 151200, title: "Personal reset", description: "Take time to mentally reset and breathe." },
  { levelId: 3, levelName: "Embodied", minPoints: 158400, title: "Identity alignment", description: "Do something aligned with who you want to be." },

  // ================= LEVEL 4 : TRANSFORMING =================
  { levelId: 4, levelName: "Transforming", minPoints: 165600, title: "Reset day", description: "Take a full day off with no pressure." },
  { levelId: 4, levelName: "Transforming", minPoints: 168000, title: "Premium self-care", description: "Treat yourself to premium self-care." },
  { levelId: 4, levelName: "Transforming", minPoints: 170400, title: "Vision journaling", description: "Write clearly about your future direction." },
  { levelId: 4, levelName: "Transforming", minPoints: 172800, title: "Celebrate your journey", description: "Acknowledge how far you’ve come and celebrate yourself." },
];

export async function seedMakeoverSelfRewardLibrary() {
  console.log("🌱 Seeding MakeoverSelfRewardLibrary...");

  for (const reward of SELF_REWARD_LIBRARY) {
    const exists = await prisma.makeoverSelfRewardLibrary.findFirst({
      where: {
        levelId: reward.levelId,
        minPoints: reward.minPoints,
      },
    });

    if (exists) continue;

    await prisma.makeoverSelfRewardLibrary.create({
      data: {
        title: reward.title,
        description: reward.description,
        levelId: reward.levelId,
        levelName: reward.levelName,
        minPoints: reward.minPoints,
        isActive: true,
      },
    });
  }

  console.log("✅ MakeoverSelfRewardLibrary seeded successfully");
}
