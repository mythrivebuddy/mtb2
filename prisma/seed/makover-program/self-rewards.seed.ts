import {prisma} from "@/lib/prisma"

/**
 * Rules:
 * - Checkpoints (levelId + minPoints) MUST remain unchanged
 * - One reward group per checkpoint
 * - 3–4 unique day-to-day options per checkpoint
 * - No overlap of options
 * - Seeder never updates existing rows
 */

const SELF_REWARD_SEED = [
  // ================= LEVEL 1 : INITIATOR =================
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 750,
    groupTitle: "Gentle start",
    groupDescription: "Choose a small, comforting pause.",
    options: [
      { title: "Tea or coffee break", description: "Make a warm drink and enjoy it calmly." },
      { title: "Slow breathing", description: "Take 5 slow, deep breaths." },
      { title: "Sit quietly", description: "Sit without your phone for a few minutes." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 1500,
    groupTitle: "Intentional rest",
    groupDescription: "Give your body and mind some rest.",
    options: [
      { title: "10 minutes of rest", description: "Lie down or sit comfortably." },
      { title: "Eye break", description: "Close your eyes and relax them." },
      { title: "Body scan", description: "Relax each body part slowly." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 2250,
    groupTitle: "Simple pleasure",
    groupDescription: "Choose a small enjoyment.",
    options: [
      { title: "Favorite snack", description: "Eat something you enjoy." },
      { title: "Fruit break", description: "Have a fruit or light treat." },
      { title: "Warm food", description: "Eat something warm and comforting." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 3000,
    groupTitle: "Mood lift",
    groupDescription: "Lift your mood in a simple way.",
    options: [
      { title: "Music break", description: "Listen to songs you love." },
      { title: "Funny reel", description: "Watch something light or funny." },
      { title: "Sing along", description: "Sing softly to a favorite song." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 4500,
    groupTitle: "Fresh air reset",
    groupDescription: "Change your surroundings slightly.",
    options: [
      { title: "Fresh air walk", description: "Step outside for fresh air." },
      { title: "Open a window", description: "Let fresh air into your room." },
      { title: "Sunlight moment", description: "Sit near sunlight for a bit." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 6000,
    groupTitle: "Physical ease",
    groupDescription: "Relax your body gently.",
    options: [
      { title: "30 minutes to relax", description: "Lie down or stretch." },
      { title: "Gentle stretching", description: "Stretch slowly without effort." },
      { title: "Warm shower", description: "Take a relaxing shower." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 8250,
    groupTitle: "Emotional check-in",
    groupDescription: "Reconnect emotionally.",
    options: [
      { title: "Check in with someone", description: "Call or text someone safe." },
      { title: "Voice note", description: "Send a kind voice note." },
      { title: "Gratitude note", description: "Write one thing you’re grateful for." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 10500,
    groupTitle: "Light entertainment",
    groupDescription: "Relax your mind lightly.",
    options: [
      { title: "Watch something light", description: "Watch one episode or short video." },
      { title: "Comedy clip", description: "Watch a comedy clip." },
      { title: "Casual scrolling", description: "Scroll mindfully for a short time." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 12750,
    groupTitle: "Small treat",
    groupDescription: "Treat yourself gently.",
    options: [
      { title: "Small personal purchase", description: "Buy a small comforting item." },
      { title: "Stationery treat", description: "Buy or use nice stationery." },
      { title: "Comfort item", description: "Use something cozy you own." },
    ],
  },
  {
    levelId: 1,
    levelName: "Initiator",
    minPoints: 15000,
    groupTitle: "Quiet focus",
    groupDescription: "Slow down and focus quietly.",
    options: [
      { title: "Read a book", description: "Read a few pages calmly." },
      { title: "Magazine browse", description: "Browse something light." },
      { title: "Silent time", description: "Sit in silence for a bit." },
    ],
  },

  // ================= LEVEL 2 : CONSISTENT =================
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 21600,
    groupTitle: "Personal recharge",
    groupDescription: "Recharge your energy.",
    options: [
      { title: "Cafe visit", description: "Visit a café or order your favorite drink." },
      { title: "Solo coffee", description: "Enjoy a drink alone." },
      { title: "Quiet outing", description: "Go out briefly by yourself." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 28800,
    groupTitle: "Movement flow",
    groupDescription: "Move your body gently.",
    options: [
      { title: "Long walk with music", description: "Walk with your playlist." },
      { title: "Yoga session", description: "Do light yoga." },
      { title: "Stretch walk", description: "Walk and stretch slowly." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 36000,
    groupTitle: "Creative focus",
    groupDescription: "Spend time creating.",
    options: [
      { title: "Hobby time", description: "Work on a hobby." },
      { title: "Sketch freely", description: "Draw or doodle." },
      { title: "DIY task", description: "Fix or build something small." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 43200,
    groupTitle: "Nourishment",
    groupDescription: "Nourish your body.",
    options: [
      { title: "Favorite meal", description: "Eat your favorite meal slowly." },
      { title: "Home-cooked food", description: "Cook something comforting." },
      { title: "Mindful eating", description: "Eat without distractions." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 50400,
    groupTitle: "Digital pause",
    groupDescription: "Reduce digital noise.",
    options: [
      { title: "Digital detox evening", description: "Limit phone usage." },
      { title: "Notification off", description: "Turn off notifications." },
      { title: "Screen-free hour", description: "Avoid screens for an hour." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 57600,
    groupTitle: "Home self-care",
    groupDescription: "Care for yourself at home.",
    options: [
      { title: "At-home self-care", description: "Simple self-care routine." },
      { title: "Face care", description: "Do basic skincare." },
      { title: "Comfort clothes", description: "Wear something cozy." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 64800,
    groupTitle: "Creative release",
    groupDescription: "Release creativity.",
    options: [
      { title: "Creative session", description: "Create something freely." },
      { title: "Music creation", description: "Play or create music." },
      { title: "Writing burst", description: "Write freely for 10 minutes." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 72000,
    groupTitle: "Inner clarity",
    groupDescription: "Reflect inwardly.",
    options: [
      { title: "Solo reflection", description: "Reflect quietly." },
      { title: "Journaling", description: "Write your thoughts." },
      { title: "Mind mapping", description: "Organize thoughts on paper." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 79200,
    groupTitle: "Refreshing outing",
    groupDescription: "Refresh your mind outside.",
    options: [
      { title: "Small outing", description: "Go out briefly alone." },
      { title: "Window shopping", description: "Browse without buying." },
      { title: "Park visit", description: "Sit in a nearby park." },
    ],
  },
  {
    levelId: 2,
    levelName: "Consistent",
    minPoints: 86400,
    groupTitle: "Self-connection",
    groupDescription: "Spend quality time with yourself.",
    options: [
      { title: "Quality self-date", description: "Plan a relaxed self-date." },
      { title: "Movie night solo", description: "Watch a movie alone." },
      { title: "Favorite playlist", description: "Enjoy your favorite playlist." },
    ],
  },

  // ================= LEVEL 3 : EMBODIED =================
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 93600,
    groupTitle: "Grounded presence",
    groupDescription: "Reconnect with the present.",
    options: [
      { title: "Nature time", description: "Spend time outdoors." },
      { title: "Barefoot grounding", description: "Stand barefoot on natural ground." },
      { title: "Observe surroundings", description: "Slowly observe your environment." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 100800,
    groupTitle: "Skill expansion",
    groupDescription: "Grow your abilities.",
    options: [
      { title: "Skill practice", description: "Practice an important skill." },
      { title: "Learning time", description: "Watch or read educational content." },
      { title: "Teach yourself", description: "Explain something to yourself." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 108000,
    groupTitle: "Emotional clarity",
    groupDescription: "Process your emotions.",
    options: [
      { title: "Deep journaling", description: "Write honestly." },
      { title: "Emotion mapping", description: "Map what you’re feeling." },
      { title: "Silent reflection", description: "Sit with your feelings." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 115200,
    groupTitle: "Mindful calm",
    groupDescription: "Calm your nervous system.",
    options: [
      { title: "Mindfulness session", description: "Guided meditation." },
      { title: "Breathwork", description: "Slow breathing exercise." },
      { title: "Body awareness", description: "Notice body sensations." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 122400,
    groupTitle: "Curious learning",
    groupDescription: "Learn without pressure.",
    options: [
      { title: "Learning time", description: "Read or watch something new." },
      { title: "Documentary clip", description: "Watch a short documentary." },
      { title: "Curiosity reading", description: "Read about a topic you like." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 129600,
    groupTitle: "Daily upgrade",
    groupDescription: "Improve daily life slightly.",
    options: [
      { title: "Upgrade daily life", description: "Improve something you use daily." },
      { title: "Organize space", description: "Organize a small area." },
      { title: "Replace small habit", description: "Swap a habit gently." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 136800,
    groupTitle: "Deep focus",
    groupDescription: "Focus deeply on something meaningful.",
    options: [
      { title: "Focused deep work", description: "Work deeply on one task." },
      { title: "Single-task sprint", description: "Focus for a short sprint." },
      { title: "Distraction-free time", description: "Remove distractions temporarily." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 144000,
    groupTitle: "Connection",
    groupDescription: "Connect meaningfully.",
    options: [
      { title: "Meaningful conversation", description: "Have a real conversation." },
      { title: "Deep listening", description: "Listen fully to someone." },
      { title: "Voice message", description: "Send a thoughtful voice message." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 151200,
    groupTitle: "Mental reset",
    groupDescription: "Reset your mind.",
    options: [
      { title: "Personal reset", description: "Pause and reset mentally." },
      { title: "Guided pause", description: "Follow a short reset guide." },
      { title: "Calm breathing", description: "Slow, calming breaths." },
    ],
  },
  {
    levelId: 3,
    levelName: "Embodied",
    minPoints: 158400,
    groupTitle: "Identity alignment",
    groupDescription: "Act in alignment with who you are becoming.",
    options: [
      { title: "Identity alignment", description: "Do something aligned with your values." },
      { title: "Future self action", description: "Act as your future self would." },
      { title: "Values check-in", description: "Reflect on your values." },
    ],
  },

  // ================= LEVEL 4 : TRANSFORMING =================
  {
    levelId: 4,
    levelName: "Transforming",
    minPoints: 165600,
    groupTitle: "Full reset",
    groupDescription: "Reset deeply and intentionally.",
    options: [
      { title: "Reset day", description: "Take a full day off." },
      { title: "Offline day", description: "Stay offline most of the day." },
      { title: "Do nothing day", description: "Release all obligations." },
    ],
  },
  {
    levelId: 4,
    levelName: "Transforming",
    minPoints: 168000,
    groupTitle: "Elevated self-care",
    groupDescription: "Care for yourself at a deeper level.",
    options: [
      { title: "Premium self-care", description: "Treat yourself intentionally." },
      { title: "Spa-like routine", description: "Create a spa experience at home." },
      { title: "Long rest", description: "Allow extended rest." },
    ],
  },
  {
    levelId: 4,
    levelName: "Transforming",
    minPoints: 170400,
    groupTitle: "Vision clarity",
    groupDescription: "Clarify where you’re headed.",
    options: [
      { title: "Vision journaling", description: "Write about your future." },
      { title: "Goal mapping", description: "Map your goals visually." },
      { title: "Future planning", description: "Plan next steps calmly." },
    ],
  },
  {
    levelId: 4,
    levelName: "Transforming",
    minPoints: 172800,
    groupTitle: "Celebrate growth",
    groupDescription: "Honor your journey.",
    options: [
      { title: "Celebrate your journey", description: "Celebrate how far you’ve come." },
      { title: "Gratitude ritual", description: "List what you’re grateful for." },
      { title: "Personal ceremony", description: "Create a small personal ritual." },
    ],
  },
];

export async function seedMakeoverSelfRewards() {
  console.log("🌱 Seeding Makeover Self Rewards (all checkpoints, no overlap)...");

  for (const seed of SELF_REWARD_SEED) {
    const checkpointExists = await prisma.makeoverSelfRewardCheckpoint.findFirst({
      where: {
        levelId: seed.levelId,
        minPoints: seed.minPoints,
      },
    });

    if (checkpointExists) continue;

    const library = await prisma.makeoverSelfRewardLibrary.create({
      data: {
        title: seed.groupTitle,
        description: seed.groupDescription,
        levelId: seed.levelId,
        levelName: seed.levelName,
        minPoints: seed.minPoints,
        isActive: true,
        options: {
          create: seed.options.map(opt => ({
            title: opt.title,
            description: opt.description,
            isActive: true,
          })),
        },
      },
    });

    await prisma.makeoverSelfRewardCheckpoint.create({
      data: {
        levelId: seed.levelId,
        minPoints: seed.minPoints,
        orderIndex: seed.minPoints,
        rewardLibraryId: library.id,
      },
    });
  }

  console.log("✅ Makeover Self Rewards seeded successfully");
}
