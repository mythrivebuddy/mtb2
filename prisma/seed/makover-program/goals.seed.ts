/// Seeds selectable goal library per area (editable by admin later)
import { prisma } from "@/lib/prisma";

type GoalSeed = {
  areaId: number;
  titles: string[];
};

const GOALS: GoalSeed[] = [
  // 1️⃣ Health & Fitness
  {
    areaId: 1,
    titles: [
      "Lose 8–12 kg sustainably",
      "Build a consistent daily movement habit",
      "Improve stamina and cardiovascular health",
      "Achieve visible muscle tone and strength",
      "Normalize sleep (7–8 hrs consistently)",
      "Reduce body fat percentage",
      "Complete a 5K or 10K run or fitness challenge",
      "Improve flexibility and mobility",
      "Eliminate frequent junk food cravings",
      "Build a disciplined nutrition routine",
      "Feel energetic throughout the day",
      "Reverse or manage a lifestyle condition",
      "Build a morning fitness routine",
      "Improve posture and body alignment",
      "Feel confident and comfortable in my body",
    ],
  },

  // 2️⃣ Mindset & Emotional Wellbeing
  {
    areaId: 2,
    titles: [
      "Reduce daily stress and anxiety",
      "Build emotional stability and calmness",
      "Improve focus and mental clarity",
      "Overcome overthinking patterns",
      "Build confidence and self-trust",
      "Develop emotional resilience",
      "Create a daily mental wellness routine",
      "Improve response to triggers and setbacks",
      "Cultivate gratitude and positivity",
      "Break negative self-talk cycles",
      "Improve decision-making clarity",
      "Feel mentally lighter and more present",
      "Build a meditation or mindfulness habit",
      "Improve emotional regulation",
      "Feel internally balanced and grounded",
    ],
  },

  // 3️⃣ Relationships
  {
    areaId: 3,
    titles: [
      "Improve communication with partner",
      "Rebuild trust and emotional connection",
      "Strengthen family relationships",
      "Attract a healthy romantic relationship",
      "Build deeper friendships",
      "Set healthy boundaries",
      "Resolve long-standing conflicts",
      "Become emotionally available and open",
      "Improve listening and empathy skills",
      "Reduce relationship stress and drama",
      "Create quality time rituals",
      "Heal from past relationship wounds",
      "Improve relationship confidence",
      "Express love more clearly",
      "Build a supportive relationship circle",
    ],
  },

  // 4️⃣ Career & Business Growth
  {
    areaId: 4,
    titles: [
      "Get a promotion or role upgrade",
      "Switch to a more fulfilling career",
      "Start or grow a business",
      "Increase income through career growth",
      "Improve productivity and focus at work",
      "Build leadership and decision skills",
      "Develop a strong professional identity",
      "Build consistency in execution",
      "Create a clear career roadmap",
      "Improve work-life balance",
      "Become confident at work communication",
      "Launch a side hustle",
      "Build professional credibility",
      "Improve performance reviews",
      "Feel confident and in control of career direction",
    ],
  },

  // 5️⃣ Wealth & Finance
  {
    areaId: 5,
    titles: [
      "Save a specific amount by year-end",
      "Build an emergency fund",
      "Clear personal or credit card debt",
      "Improve monthly budgeting discipline",
      "Start investing consistently",
      "Increase income streams",
      "Build a healthy money mindset",
      "Track and control expenses",
      "Reduce impulsive spending",
      "Learn basic investing principles",
      "Improve financial confidence",
      "Build long-term wealth habits",
      "Create a financial plan",
      "Feel stress-free about money",
      "Achieve financial stability and clarity",
    ],
  },

  // 6️⃣ Social Life & Influence
  {
    areaId: 6,
    titles: [
      "Build confidence in social settings",
      "Improve communication skills",
      "Grow a strong personal network",
      "Become more visible and expressive",
      "Build influence in professional or social circles",
      "Overcome social anxiety",
      "Improve public speaking confidence",
      "Build meaningful social connections",
      "Be more assertive and articulate",
      "Build a respected social identity",
      "Improve online presence",
      "Share ideas confidently",
      "Build a supportive peer circle",
      "Become comfortable meeting new people",
      "Feel socially confident and impactful",
    ],
  },

  // 7️⃣ Skills & Intelligence
  {
    areaId: 7,
    titles: [
      "Learn a new high-value skill",
      "Improve problem-solving ability",
      "Build deep focus and learning discipline",
      "Improve strategic thinking",
      "Read consistently and apply learning",
      "Upskill for career or business growth",
      "Improve memory and comprehension",
      "Build execution mastery",
      "Become better at decision-making",
      "Improve analytical thinking",
      "Learn a digital or AI-related skill",
      "Improve writing or communication skill",
      "Build learning consistency",
      "Gain mastery in a chosen domain",
      "Become intellectually confident",
    ],
  },

  // 8️⃣ Lifestyle & Personal Upgrades
  {
    areaId: 8,
    titles: [
      "Build a powerful daily routine",
      "Improve time management",
      "Create an organized living space",
      "Upgrade personal habits",
      "Reduce digital distractions",
      "Build consistency in self-care",
      "Improve morning and night routines",
      "Design an ideal lifestyle structure",
      "Improve personal discipline",
      "Build better work-life systems",
      "Create a clutter-free environment",
      "Improve personal presentation",
      "Optimize energy throughout the day",
      "Live more intentionally",
      "Feel in control of daily life",
    ],
  },

  // 9️⃣ Spiritual Growth
  {
    areaId: 9,
    titles: [
      "Discover deeper life purpose",
      "Build inner peace and calm",
      "Develop self-awareness",
      "Practice daily mindfulness",
      "Strengthen connection with self",
      "Align life with core values",
      "Reduce inner noise and restlessness",
      "Build a reflection or journaling habit",
      "Cultivate compassion and acceptance",
      "Feel connected beyond material goals",
      "Develop gratitude as a way of life",
      "Build spiritual consistency",
      "Improve presence and awareness",
      "Heal inner conflicts",
      "Feel fulfilled and aligned internally",
    ],
  },
];

export async function seedMakeoverGoals() {
  for (const group of GOALS) {
    for (const title of group.titles) {
      await prisma.makeoverGoalLibrary.upsert({
        where: {
          areaId_title: {
            areaId: group.areaId,
            title,
          },
        },
        update: {}, // never mutate admin-seeded data
        create: {
          areaId: group.areaId,
          title,
          isCustom: false,
        },
      });
    }
  }
}
