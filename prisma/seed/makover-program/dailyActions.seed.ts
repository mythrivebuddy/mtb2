/// Seeds daily action task options per area
import { prisma } from "@/lib/prisma";

const ACTIONS = [
  {
    areaId: 1, // Health & Fitness
    titles: [
      "Walk a minimum 10,000 steps every day",
      "Do a structured workout (home/gym)",
      "Stretch or mobility practice",
      "Follow a planned nutrition choice",
      "Track meals consciously",
      "Avoid junk/sugar for the day",
      "Do a short cardio session",
      "Practice sleep hygiene routine",
      "Drink required water intake",
      "Do any intentional physical movement",
    ],
  },
  {
    areaId: 2, // Mindset & Emotional Wellbeing
    titles: [
      "Meditate or sit in silence",
      "Journal thoughts or emotions",
      "Practice controlled breathing",
      "Do a stress-release activity",
      "Pause & respond consciously to triggers",
      "Practice gratitude intentionally",
      "Limit negative inputs (news/social)",
      "Do a calming ritual",
      "Observe thoughts without reacting",
      "Do one act of self-care",
    ],
  },
  {
    areaId: 3, // Relationships
    titles: [
      "Have one meaningful conversation",
      "Express appreciation to someone",
      "Practice active listening",
      "Spend quality time with a loved one",
      "Reach out to reconnect with someone",
      "Respect a boundary (yours or theirs)",
      "Resolve a small conflict calmly",
      "Do one thoughtful gesture",
      "Communicate honestly about feelings",
      "Show emotional presence",
    ],
  },
  {
    areaId: 4, // Career & Business Growth
    titles: [
      "Deep focused work session",
      "Skill practice related to career",
      "Progress one important task",
      "Learning or upskilling activity",
      "Outreach or networking action",
      "Planning or prioritization activity",
      "Improve one work deliverable",
      "Review goals or performance",
      "Take initiative beyond basics",
      "Execute one uncomfortable action",
    ],
  },
  {
    areaId: 5, // Wealth & Finance
    titles: [
      "Track daily expenses",
      "Stick to planned spending",
      "No-spend action for the day",
      "Review financial plan",
      "Save a fixed amount",
      "Learn one financial concept",
      "Review subscriptions or expenses",
      "Avoid impulse purchase",
      "Update net-worth or budget",
      "Act consciously with money",
    ],
  },
  {
    areaId: 6, // Social Life & Influence
    titles: [
      "Start or engage in conversations",
      "Share thoughts or ideas openly",
      "Connect with a new person",
      "Participate actively in a group",
      "Practice confident communication",
      "Share value or insight publicly",
      "Attend or engage in a social space",
      "Improve online presence",
      "Speak up where you usually don’t",
      "Build one meaningful connection",
    ],
  },
  {
    areaId: 7, // Skills & Intelligence
    titles: [
      "Learn a specific skill daily",
      "Practice a skill deliberately",
      "Read and apply learning",
      "Solve a problem or challenge",
      "Practice thinking or analysis",
      "Study a chosen subject",
      "Review and reinforce learning",
      "Teach or explain what you learned",
      "Build consistency in learning",
      "Apply knowledge in real life",
    ],
  },
  {
    areaId: 8, // Lifestyle & Personal Upgrades
    titles: [
      "Follow a fixed daily routine",
      "Organize environment or space",
      "Reduce distractions intentionally",
      "Manage time blocks effectively",
      "Maintain cleanliness/order",
      "Improve a daily habit",
      "Follow morning or night routine",
      "Upgrade one small lifestyle habit",
      "Limit screen or digital usage",
      "Live intentionally for the day",
    ],
  },
  {
    areaId: 9, // Spiritual Growth
    titles: [
      "Meditation or mindfulness practice",
      "Reflection or journaling",
      "Practice gratitude",
      "Silent awareness practice",
      "Observe thoughts and emotions",
      "Align actions with values",
      "Read spiritual or reflective content",
      "Practice compassion or kindness",
      "Connect with inner self",
      "Live consciously and present",
    ],
  },
];

export async function seedMakeoverDailyActions() {
  for (const group of ACTIONS) {
    for (const title of group.titles) {
      await prisma.makeoverDailyActionLibrary.upsert({
        where: {
          areaId_title: {
            areaId: group.areaId,
            title,
          },
        },
        update: {},
        create: {
          areaId: group.areaId,
          title,
          isCustom: false,
        },
      });
    }
  }
}